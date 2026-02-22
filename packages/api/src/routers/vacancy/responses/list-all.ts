import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray, lt } from "@qbs-autonaim/db";
import {
  interviewScoring,
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { sanitizeHtml } from "../../utils/sanitize-html";

export const listAll = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(20),
      cursor: z.coerce.date().optional(),
    }),
  )
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

    // Запрашиваем limit + 1 для определения hasMore
    const responses = await context.db
      .select({
        response: responseTable,
        vacancy: vacancy,
      })
      .from(responseTable)
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(vacancy.workspaceId, input.workspaceId),
          input.cursor ? lt(responseTable.createdAt, input.cursor) : undefined,
        ),
      )
      .orderBy(desc(responseTable.createdAt))
      .limit(input.limit + 1);

    const hasMore = responses.length > input.limit;
    const items = hasMore ? responses.slice(0, input.limit) : responses;

    if (items.length === 0) {
      return {
        items: [],
        nextCursor: undefined,
        hasMore: false,
      };
    }

    // Собираем все ID откликов для батчевых запросов
    const responseIds = items.map((r) => r.response.id);

    // Батчевый запрос screening
    const screenings = await context.db
      .select()
      .from(responseScreening)
      .where(inArray(responseScreening.responseId, responseIds));

    // Батчевый запрос interviewScoring
    const interviewScorings = await context.db
      .select()
      .from(interviewScoring)
      .where(inArray(interviewScoring.responseId, responseIds));

    // Создаем lookup maps
    const screeningMap = new Map(screenings.map((s) => [s.responseId, s]));
    const interviewScoringMap = new Map(
      interviewScorings.map((i) => [i.responseId, i]),
    );

    // Объединяем результаты с санитизацией HTML
    const responsesWithRelations = items.map((r) => {
      const screening = screeningMap.get(r.response.id);
      const interviewScoring = interviewScoringMap.get(r.response.id);

      return {
        ...r.response,
        vacancy: r.vacancy,
        screening: screening
          ? {
              ...screening,
              analysis: screening.overallAnalysis
                ? sanitizeHtml(screening.overallAnalysis)
                : null,
            }
          : null,
        interviewScoring: interviewScoring
          ? {
              score:
                interviewScoring.rating ??
                Math.round(interviewScoring.score / 20),
              detailedScore: interviewScoring.score,
              analysis: interviewScoring.analysis
                ? sanitizeHtml(interviewScoring.analysis)
                : null,
              botUsageDetected: interviewScoring.botUsageDetected ?? null,
            }
          : null,
      };
    });

    const lastItem = items[items.length - 1];

    return {
      items: responsesWithRelations,
      nextCursor: hasMore && lastItem ? lastItem.response.createdAt : undefined,
      hasMore,
    };
  });
