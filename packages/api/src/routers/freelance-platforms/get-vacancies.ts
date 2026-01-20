import { and, count, desc, eq, isNull, sql } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

const getVacanciesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  source: z
    .enum([
      "HH",
      "KWORK",
      "FL_RU",
      "FREELANCE_RU",
      "WEB_LINK",
      "AVITO",
      "SUPERJOB",
      "HABR",
    ])
    .optional(),
  sortBy: z
    .enum(["createdAt", "title", "views", "responses", "newResponses"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const getVacancies = protectedProcedure
  .input(getVacanciesInputSchema)
  .query(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent
    );

    try {
      // Проверка доступа к workspace
      const access = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id
      );

      if (!access) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Построение условий фильтрации
      const conditions = [
        eq(vacancy.workspaceId, input.workspaceId),
        isNull(vacancy.mergedIntoVacancyId),
      ];

      // Фильтрация по источнику, если указан
      if (input.source) {
        conditions.push(eq(vacancy.source, input.source));
      }

      // Базовый запрос
      const query = ctx.db
        .select({
          id: vacancy.id,
          workspaceId: vacancy.workspaceId,
          title: vacancy.title,
          url: vacancy.url,
          views: vacancy.views,
          responses: vacancy.responses,
          newResponses: vacancy.newResponses,
          resumesInProgress: vacancy.resumesInProgress,
          suitableResumes: vacancy.suitableResumes,
          region: vacancy.region,
          description: vacancy.description,
          requirements: vacancy.requirements,
          source: vacancy.source,
          externalId: vacancy.externalId,
          customBotInstructions: vacancy.customBotInstructions,
          customScreeningPrompt: vacancy.customScreeningPrompt,
          customInterviewQuestions: vacancy.customInterviewQuestions,
          customOrganizationalQuestions: vacancy.customOrganizationalQuestions,
          isActive: vacancy.isActive,
          createdAt: vacancy.createdAt,
          updatedAt: vacancy.updatedAt,
          // Статистика по источникам откликов
          hhApiCount: sql<number>`COUNT(CASE WHEN ${responseTable.importSource} = 'HH' THEN 1 END)`,
          freelanceManualCount: sql<number>`COUNT(CASE WHEN ${responseTable.importSource} = 'MANUAL' THEN 1 END)`,
          freelanceLinkCount: sql<number>`COUNT(CASE WHEN ${responseTable.importSource} = 'WEB_LINK' THEN 1 END)`,
          totalResponsesCount: count(responseTable.id),
        })
        .from(vacancy)
        .leftJoin(
          responseTable,
          and(
            eq(vacancy.id, responseTable.entityId),
            eq(responseTable.entityType, "vacancy")
          )
        )
        .where(and(...conditions));

      // Сортировка
      const { sortBy = "createdAt", sortOrder = "desc" } = input;
      const orderFn = sortOrder === "asc" ? sql.asc : desc;

      const orderByMapping: Record<string, any> = {
        createdAt: vacancy.createdAt,
        title: vacancy.title,
        views: vacancy.views,
        responses: count(responseTable.id),
        newResponses: vacancy.newResponses,
      };

      const orderBy = orderByMapping[sortBy] || vacancy.createdAt;

      const vacancies = await query
        .groupBy(vacancy.id)
        .orderBy(
          sortOrder === "asc" ? sql`${orderBy} ASC` : sql`${orderBy} DESC`
        );

      return vacancies;
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        workspaceId: input.workspaceId,
        operation: "get_vacancies",
      });
    }
  });
