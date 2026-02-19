import { and, count, desc, eq, sql } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const list = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
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

    const vacancies = await ctx.db
      .select({
        id: vacancy.id,
        workspaceId: vacancy.workspaceId,
        title: vacancy.title,
        url: vacancy.url,
        totalResponsesCount: count(responseTable.id),
        newResponses: sql<number>`CAST(COUNT(CASE WHEN ${responseTable.status} = 'NEW' THEN 1 END) AS INTEGER)`.as(
          "newResponses",
        ),
        resumesInProgress: vacancy.resumesInProgress,
        suitableResumes: vacancy.suitableResumes,
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
      })
      .from(vacancy)
      .leftJoin(
        responseTable,
        and(
          eq(vacancy.id, responseTable.entityId),
          eq(responseTable.entityType, "vacancy"),
        ),
      )
      .where(eq(vacancy.workspaceId, input.workspaceId))
      .groupBy(vacancy.id)
      .orderBy(desc(vacancy.createdAt));

    return vacancies;
  });
