import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  interviewScoring as interviewScoringTable,
  interviewSession,
  responseScreening as responseScreeningTable,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { sanitizeHtml } from "../../utils/sanitize-html";
import { mapScreeningToOutput } from "./mappers/screening-mapper";

export const get = protectedProcedure
  .input(z.object({ id: z.string(), workspaceId: workspaceIdSchema }))
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

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.id),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      return null;
    }

    // Query vacancy separately to check workspace access
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Проверка принадлежности вакансии к workspace
    if (vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Query resumePdfFile separately if exists
    const resumePdfFileId = response.resumePdfFileId;
    const resumePdfFile = resumePdfFileId
      ? await ctx.db.query.file.findFirst({
          where: (f, { eq }) => eq(f.id, resumePdfFileId),
        })
      : null;

    // Query screening separately
    const screening = await ctx.db.query.responseScreening.findFirst({
      where: eq(responseScreeningTable.responseId, response.id),
    });

    // Query interviewSession separately
    const session = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSession.responseId, response.id),
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
    const sessionInterviewScoring = session
      ? await ctx.db.query.interviewScoring.findFirst({
          where: eq(interviewScoringTable.interviewSessionId, session.id),
        })
      : null;

    const directInterviewScoring =
      await ctx.db.query.interviewScoring.findFirst({
        where: eq(interviewScoringTable.responseId, response.id),
      });

    let resumePdfUrl: string | null = null;
    if (resumePdfFile) {
      resumePdfUrl = await getDownloadUrl(resumePdfFile.key);
    }

    // Get voice file URLs for messages and map null to undefined
    const messagesWithUrls = session?.messages
      ? await Promise.all(
          session.messages.map(async (message) => {
            const baseMessage = {
              ...message,
              voiceDuration: message.voiceDuration ?? undefined,
              voiceTranscription: message.voiceTranscription ?? undefined,
            };

            if (message.file) {
              const voiceUrl = await getDownloadUrl(message.file.key);
              return { ...baseMessage, voiceUrl };
            }
            return baseMessage;
          }),
        )
      : [];

    return {
      ...response,
      workspaceId: vacancy.workspaceId,
      resumePdfUrl,
      screening: screening ? mapScreeningToOutput(screening) : null,
      interviewScoring: directInterviewScoring
        ? ({
            score:
              directInterviewScoring.rating ??
              Math.round(directInterviewScoring.score / 20),
            detailedScore: directInterviewScoring.score,
            analysis: directInterviewScoring.analysis
              ? sanitizeHtml(directInterviewScoring.analysis)
              : null,
            botUsageDetected: directInterviewScoring.botUsageDetected,
          } as {
            score: number;
            detailedScore: number;
            analysis: string | null;
            botUsageDetected: number | null;
          })
        : null,
      interviewSession: session
        ? ({
            ...session,
            messages: (messagesWithUrls || []) as unknown[],
            interviewScoring: sessionInterviewScoring
              ? ({
                  score: sessionInterviewScoring.score,
                  analysis: sessionInterviewScoring.analysis
                    ? sanitizeHtml(sessionInterviewScoring.analysis)
                    : null,
                } as {
                  score: number;
                  analysis: string | null;
                })
              : null,
          } as unknown)
        : undefined,
      globalCandidateId: null,
    };
  });
