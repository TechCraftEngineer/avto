import { and, eq } from "@qbs-autonaim/db";
import {
  gig,
  interviewScoring,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const get = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ ctx, input }) => {
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

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
      with: {
        globalCandidate: true,
        screening: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Получаем interviewSession с сообщениями
    const sessionData = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSession.responseId, input.responseId),
      with: {
        messages: {
          with: {
            file: true,
          },
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
      },
    });

    // Query interview scoring separately (both from session and direct)
    const sessionInterviewScoring = sessionData
      ? await ctx.db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.interviewSessionId, sessionData.id),
        })
      : null;

    return {
      ...response,
      gig: existingGig
        ? {
            id: existingGig.id,
            title: existingGig.title,
            description: existingGig.description,
            budgetMin: existingGig.budgetMin,
            budgetMax: existingGig.budgetMax,
            deadline: existingGig.deadline,
            estimatedDuration: existingGig.estimatedDuration,
            requiredSkills: existingGig.requirements?.required_skills ?? [],
          }
        : null,
      interviewScoring: sessionInterviewScoring
        ? {
            score:
              sessionInterviewScoring.rating ??
              Math.round(sessionInterviewScoring.score / 20),
            detailedScore: sessionInterviewScoring.score,
            analysis: sessionInterviewScoring.analysis,
            botUsageDetected: sessionInterviewScoring.botUsageDetected,
          }
        : null,
      interviewSession: sessionData,
    };
  });
