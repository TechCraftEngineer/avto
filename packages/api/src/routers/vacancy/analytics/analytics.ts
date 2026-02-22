import { ORPCError } from "@orpc/server";
import { and, count, eq, gte, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const analytics = protectedProcedure
  .input(z.object({ vacancyId: z.string(), workspaceId: workspaceIdSchema }))
  .handler(async ({ context, input }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверка принадлежности вакансии к workspace
    const vacancyCheck = await context.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!vacancyCheck) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }
    // Получаем общее количество откликов
    const totalResponsesResult = await context.db
      .select({ count: count() })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, input.vacancyId),
        ),
      );

    const totalResponses = totalResponsesResult[0]?.count ?? 0;

    // Получаем количество обработанных откликов (с скринингом)
    const processedResponsesResult = await context.db
      .select({ count: count() })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, input.vacancyId),
        ),
      );

    const processedResponses = processedResponsesResult[0]?.count ?? 0;

    // Получаем количество кандидатов со скорингом >= 3
    const highScoreResponsesResult = await context.db
      .select({ count: count() })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, input.vacancyId),
          gte(responseScreening.overallScore, 3),
        ),
      );

    const highScoreResponses = highScoreResponsesResult[0]?.count ?? 0;

    // Получаем количество кандидатов со скорингом >= 4
    const topScoreResponsesResult = await context.db
      .select({ count: count() })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, input.vacancyId),
          gte(responseScreening.overallScore, 4),
        ),
      );

    const topScoreResponses = topScoreResponsesResult[0]?.count ?? 0;

    // Получаем средний скоринг
    const avgScoreResult = await context.db
      .select({
        avg: sql<number>`COALESCE(AVG(${responseScreening.overallScore}), 0)`,
      })
      .from(responseTable)
      .innerJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, input.vacancyId),
        ),
      );

    const avgScore = avgScoreResult[0]?.avg ?? 0;

    return {
      totalResponses,
      processedResponses,
      highScoreResponses, // >= 3
      topScoreResponses, // >= 4
      avgScore: Math.round(avgScore * 10) / 10, // Округляем до 1 знака
    };
  });
