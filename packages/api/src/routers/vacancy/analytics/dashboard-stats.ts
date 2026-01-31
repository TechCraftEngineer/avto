import { and, count, eq, gte, isNull, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const dashboardStats = protectedProcedure
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

    const userVacancies = await ctx.db.query.vacancy.findMany({
      where: (vacancy, { eq }) => eq(vacancy.workspaceId, input.workspaceId),
      orderBy: (vacancy, { desc }) => [desc(vacancy.createdAt)],
    });

    const vacancyIds = userVacancies.map((v) => v.id);

    if (vacancyIds.length === 0) {
      return {
        totalVacancies: 0,
        activeVacancies: 0,
        totalResponses: 0,
        processedResponses: 0,
        highScoreResponses: 0,
        topScoreResponses: 0,
        avgScore: 0,
        newResponses: 0,
      };
    }

    const totalVacancies = userVacancies.length;
    const activeVacancies = userVacancies.filter((v) => v.isActive).length;

    const totalResponsesResult = await ctx.db
      .select({ count: count() })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          sql`${responseTable.entityId} IN (${sql.join(
            vacancyIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
      );

    const totalResponses = totalResponsesResult[0]?.count ?? 0;

    const processedResponsesResult = await ctx.db
      .select({ count: count() })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          sql`${responseTable.entityId} IN (${sql.join(
            vacancyIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
      );

    const processedResponses = processedResponsesResult[0]?.count ?? 0;

    const highScoreResponsesResult = await ctx.db
      .select({ count: count() })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          sql`${responseTable.entityId} IN (${sql.join(
            vacancyIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          gte(responseScreening.score, 3),
        ),
      );

    const highScoreResponses = highScoreResponsesResult[0]?.count ?? 0;

    const topScoreResponsesResult = await ctx.db
      .select({ count: count() })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          sql`${responseTable.entityId} IN (${sql.join(
            vacancyIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          gte(responseScreening.score, 4),
        ),
      );

    const topScoreResponses = topScoreResponsesResult[0]?.count ?? 0;

    const avgScoreResult = await ctx.db
      .select({
        avg: sql<number>`COALESCE(AVG(${responseScreening.score}), 0)`,
      })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          sql`${responseTable.entityId} IN (${sql.join(
            vacancyIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
      );

    const avgScore = avgScoreResult[0]?.avg ?? 0;

    const newResponsesResult = await ctx.db
      .select({ count: count() })
      .from(responseTable)
      .leftJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          sql`${responseTable.entityId} IN (${sql.join(
            vacancyIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          isNull(responseScreening.id),
        ),
      );

    const newResponses = newResponsesResult[0]?.count ?? 0;

    return {
      totalVacancies,
      activeVacancies,
      totalResponses,
      processedResponses,
      highScoreResponses,
      topScoreResponses,
      avgScore: Math.round(avgScore * 10) / 10,
      newResponses,
    };
  });
