import { randomUUID } from "node:crypto";
import { env } from "@qbs-autonaim/config";
import { interviewMessage } from "@qbs-autonaim/db/schema";
import { messageBufferService } from "@qbs-autonaim/jobs/services/buffer";
import type { BufferedMessage } from "@qbs-autonaim/shared";
import { ORPCError } from "@orpc/server";
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
  .handler(async ({ input, context }) => {
    const errorHandler = createErrorHandler(
      context.auditLogger,
      undefined,
      context.ipAddress,
      context.userAgent,
    );

    try {
      // Доступ уже проверен в middleware

      // Проверяем существование interviewSession
      const session = await context.db.query.interviewSession.findFirst({
        where: (interviewSession, { eq, and }) =>
          and(
            eq(interviewSession.id, context.verifiedInterviewSessionId),
            eq(interviewSession.lastChannel, "web"),
          ),
      });

      if (!session) {
        throw await errorHandler.handleNotFoundError("Интервью", {
          sessionId: context.verifiedInterviewSessionId,
        });
      }

      // Проверяем, что интервью активно
      if (session.status !== "active" && session.status !== "pending") {
        throw await errorHandler.handleValidationError("Интервью завершено", {
          sessionId: context.verifiedInterviewSessionId,
          status: session.status,
        });
      }

      // Получаем текущий номер вопроса из метаданных с валидацией
      const parsedMetadata = sessionMetadataSchema.parse(
        session.metadata || {},
      );
      const interviewStep = parsedMetadata.questionAnswers.length + 1;

      // Сохраняем сообщение в interview_messages
      const [savedMessage] = await context.db
        .insert(interviewMessage)
        .values({
          sessionId: context.verifiedInterviewSessionId,
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
            sessionId: context.verifiedInterviewSessionId,
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
        chatSessionId: context.verifiedInterviewSessionId,
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
                sessionId: context.verifiedInterviewSessionId,
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
      if (error instanceof ORPCError) {
        throw error;
      }
      // Все остальные ошибки обрабатываем через errorHandler
      throw await errorHandler.handleDatabaseError(error as Error, {
        sessionId: context.verifiedInterviewSessionId,
        operation: "send_chat_message",
      });
    }
  });
