import { and, desc, eq, sql } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const listActive = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(5),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Подсчёт откликов из таблицы responses — закэшированные vacancy.responses
    // могут быть устаревшими (не обновляются при парсинге HH и т.д.)
    const rows = await ctx.db
      .select({
        id: vacancy.id,
        workspaceId: vacancy.workspaceId,
        title: vacancy.title,
        url: vacancy.url,
        region: vacancy.region,
        workLocation: vacancy.workLocation,
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
        responses: sql<number>`CAST(COUNT(${responseTable.id}) AS INTEGER)`.as(
          "responses",
        ),
        newResponses:
          sql<number>`CAST(COUNT(CASE WHEN ${responseTable.status} = 'NEW' THEN 1 END) AS INTEGER)`.as(
            "newResponses",
          ),
      })
      .from(vacancy)
      .leftJoin(
        responseTable,
        and(
          eq(vacancy.id, responseTable.entityId),
          eq(responseTable.entityType, "vacancy"),
        ),
      )
      .where(
        and(
          eq(vacancy.workspaceId, input.workspaceId),
          eq(vacancy.isActive, true),
        ),
      )
      .groupBy(vacancy.id)
      .orderBy(desc(vacancy.createdAt))
      .limit(input.limit);

    return rows;
  });
