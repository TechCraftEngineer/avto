import { ORPCError } from "@orpc/server";
import { desc, eq } from "@qbs-autonaim/db";
import {
  interviewMessage,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const listMessages = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Find interview session for this vacancy response
    const interview = await context.db.query.interviewSession.findFirst({
      where: eq(interviewSession.responseId, input.candidateId),
    });

    if (!interview) {
      return [];
    }

    // Get vacancy response for candidate name
    const response = await context.db.query.response.findFirst({
      where: eq(responseTable.id, input.candidateId),
      columns: { candidateName: true },
    });

    const messages = await context.db.query.interviewMessage.findMany({
      where: eq(interviewMessage.sessionId, interview.id),
      orderBy: desc(interviewMessage.createdAt),
      limit: 100,
      with: {
        file: true,
      },
    });

    return Promise.all(
      messages.reverse().map(async (msg) => {
        const isVoice = msg.type === "voice";
        let voiceUrl: string | undefined;

        if (isVoice && msg.file?.key) {
          try {
            voiceUrl = await getDownloadUrl(msg.file.key);
          } catch (error) {
            console.error("Failed to generate presigned URL:", error);
          }
        }

        return {
          id: msg.id,
          interviewSessionId: interview.id,
          content: isVoice
            ? msg.voiceTranscription || "Голосовое сообщение"
            : msg.content,
          sender: msg.role === "user" ? "candidate" : "recruiter",
          senderName:
            msg.role === "user"
              ? response?.candidateName || "Кандидат"
              : "Рекрутер",
          senderAvatar: null,
          timestamp: msg.createdAt,
          type: isVoice ? ("voice" as const) : ("text" as const),
          voiceUrl,
          voiceTranscription: msg.voiceTranscription || undefined,
          voiceDuration: msg.voiceDuration ?? undefined,
        };
      }),
    );
  });
