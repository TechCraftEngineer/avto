import { randomUUID } from "node:crypto";
import { env } from "@qbs-autonaim/config";
import { interviewMessage } from "@qbs-autonaim/db/schema";
import { messageBufferService } from "@qbs-autonaim/jobs/services/buffer";
import type { BufferedMessage } from "@qbs-autonaim/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createErrorHandler } from "../../../utils/error-handler";
import { withInterviewAccess } from "../../../utils/interview-access-middleware";

const sendChatMessageInputSchema = z.object({
  sessionId: z.uuid().optional(),
  interviewSessionId: z.uuid().optional(),
  interviewToken: z.string().optional(),
  message: z.string().min(1, "Сообщение не может быть пустым").max(10000),
});

const sessionMetadataSchema = z
  .object({
    questionAnswers: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .default([]),
  })
  .default({ questionAnswers: [] });

export const sendChatMessage = withInterviewAccess
  .input(sendChatMessageInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      undefined,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Доступ уже проверен в middleware

      // Проверяем существование interviewSession
      const session = await ctx.db.query.interviewSession.findFirst({
        where: (interviewSession, { eq, and }) =>
          and(
            eq(interviewSession.id, ctx.verifiedInterviewSessionId),
            eq(interviewSession.lastChannel, "web"),
          ),
      });

      if (!session) {
        throw await errorHandler.handleNotFoundError("Интервью", {
          sessionId: ctx.verifiedInterviewSessionId,
        });
      }

      // Проверяем, что интервью активно
      if (session.status !== "active" && session.status !== "pending") {
        throw await errorHandler.handleValidationError("Интервью завершено", {
          sessionId: ctx.verifiedInterviewSessionId,
          status: session.status,
        });
      }

      // Получаем текущий номер вопроса из метаданных с валидацией
      const parsedMetadata = sessionMetadataSchema.parse(
        session.metadata || {},
      );
      const interviewStep = parsedMetadata.questionAnswers.length + 1;

      // Сохраняем сообщение в interview_messages
      const [savedMessage] = await ctx.db
        .insert(interviewMessage)
        .values({
          sessionId: ctx.verifiedInterviewSessionId,
          role: "user",
          type: "text",
          channel: "web",
          content: input.message,
        })
        .returning();

      if (!savedMessage) {
        throw await errorHandler.handleInternalError(
          new Error("Failed to save message"),
          {
            sessionId: ctx.verifiedInterviewSessionId,
          },
        );
      }

      // Добавляем сообщение в буфер
      const messageId = randomUUID();
      const timestamp = Date.now();

      const bufferedMessage: BufferedMessage = {
        id: messageId,
        content: input.message,
        contentType: "TEXT",
        timestamp,
      };

      // Получаем username из metadata или используем web_user
      const username =
        (session.metadata as { telegramUsername?: string })?.telegramUsername ||
        "web_user";

      await messageBufferService.addMessage({
        userId: username,
        chatSessionId: ctx.verifiedInterviewSessionId,
        interviewStep,
        message: bufferedMessage,
      });

      // Отправляем событие debounce через fetch (так как Inngest клиент доступен только в jobs)
      const inngestEventUrl = env.INNGEST_EVENT_API_BASE_URL;
      const inngestEventKey = env.INNGEST_EVENT_KEY;

      if (inngestEventKey) {
        try {
          await fetch(`${inngestEventUrl}/e/${inngestEventKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "interview/message.buffered",
              data: {
                userId: username,
                sessionId: ctx.verifiedInterviewSessionId,
                interviewStep,
                messageId,
                timestamp,
              },
            }),
          });
        } catch (error) {
          console.error("Failed to send Inngest event:", error);
          // Не бросаем ошибку, чтобы не блокировать пользователя
        }
      }

      return {
        success: true,
        messageId: savedMessage.id,
      };
    } catch (error) {
      // Пробрасываем TRPC ошибки как есть
      if (error instanceof TRPCError) {
        throw error;
      }
      // Все остальные ошибки обрабатываем через errorHandler
      throw await errorHandler.handleDatabaseError(error as Error, {
        sessionId: ctx.verifiedInterviewSessionId,
        operation: "send_chat_message",
      });
    }
  });
