import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "@qbs-autonaim/db";
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

export const listRecent = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const responses = await ctx.db
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
        ),
      )
      .orderBy(desc(responseTable.createdAt))
      .limit(5);

    // Получаем screening и interviewScoring для каждого отклика
    const responsesWithRelations = await Promise.all(
      responses.map(async (r) => {
        const screening = await ctx.db.query.responseScreening.findFirst({
          where: eq(responseScreening.responseId, r.response.id),
          orderBy: desc(responseScreening.updatedAt),
        });

        const scoring = await ctx.db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.responseId, r.response.id),
          orderBy: desc(interviewScoring.createdAt),
        });

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
