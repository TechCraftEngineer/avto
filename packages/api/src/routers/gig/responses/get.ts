import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  gig,
  interviewScoring,
  interviewSession,
  responseScheduledInterview as responseScheduledInterviewTable,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const get = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      workspaceId: workspaceIdSchema,
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

    const response = await context.db.query.response.findFirst({
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
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    // Получаем interviewSession с сообщениями
    const sessionData = await context.db.query.interviewSession.findFirst({
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
      ? await context.db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.interviewSessionId, sessionData.id),
        })
      : null;

    const scheduledInterview =
      await context.db.query.responseScheduledInterview.findFirst({
        where: eq(responseScheduledInterviewTable.responseId, response.id),
      });

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
      scheduledInterview: scheduledInterview
        ? {
            scheduledAt: scheduledInterview.scheduledAt,
            durationMinutes: scheduledInterview.durationMinutes,
            calendarEventUrl: scheduledInterview.calendarEventUrl,
          }
        : null,
    };
  });
