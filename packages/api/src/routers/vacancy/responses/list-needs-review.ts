import { ORPCError } from "@orpc/server";
import { and, desc, eq, isNull } from "@qbs-autonaim/db";
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

/**
 * Отклики на рассмотрении: скрининг пройден, оценка есть, решение HR ещё не принято.
 * Это отклики, которые реально требуют внимания — их нужно пригласить/отклонить.
 */
export const listNeedsReview = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().int().min(1).max(10).default(5),
    }),
  )
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    const rows = await context.db
      .select({
        response: responseTable,
        vacancy: vacancy,
        screening: responseScreening,
      })
      .from(responseTable)
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .innerJoin(
        responseScreening,
        eq(responseScreening.responseId, responseTable.id),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(vacancy.workspaceId, input.workspaceId),
          eq(responseTable.status, "EVALUATED"),
          isNull(responseTable.hrSelectionStatus),
        ),
      )
      .orderBy(
        desc(responseScreening.overallScore),
        desc(responseTable.createdAt),
      )
      .limit(input.limit);

    const responsesWithRelations = await Promise.all(
      rows.map(async (r) => {
        const scoring = await context.db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.responseId, r.response.id),
          orderBy: desc(interviewScoring.createdAt),
        });

        return {
          ...r.response,
          vacancy: r.vacancy,
          screening: r.screening
            ? {
                ...r.screening,
                analysis: r.screening.overallAnalysis
                  ? sanitizeHtml(r.screening.overallAnalysis)
                  : null,
              }
            : null,
          interviewScoring: scoring
            ? {
                score: scoring.rating ?? Math.round(scoring.score / 20),
                detailedScore: scoring.score,
                analysis: scoring.analysis
                  ? sanitizeHtml(scoring.analysis)
                  : null,
              }
            : null,
        };
      }),
    );

    return responsesWithRelations;
  });
