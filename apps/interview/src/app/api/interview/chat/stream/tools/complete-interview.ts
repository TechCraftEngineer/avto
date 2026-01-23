/**
 * Tool для завершения интервью
 * Вызывает inngest событие для создания скоринга и обновления статусов
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  interviewSession,
  response,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import {
  getInterviewSessionMetadata,
  updateInterviewSessionMetadata,
} from "@qbs-autonaim/server-utils";
import { tool } from "ai";
import { desc } from "@qbs-autonaim/db";
import { z } from "zod";

export function createCompleteInterviewTool(sessionId: string) {
  return tool({
    description: `Завершает интервью, создаёт скоринг и обновляет статус отклика.

КОГДА ВЫЗЫВАТЬ:
- Когда stage = "wrapup" и кандидат ответил на финальный вопрос
- Когда кандидат явно просит завершить интервью
- После вопроса "Есть ли что-то, что вы хотели бы уточнить?" и ответа кандидата

ВАЖНО:
- Вызывай ОДИН раз в конце интервью
- Перед вызовом убедись, что вызвал getBotDetectionSummary для учёта в оценке
- После вызова НЕ задавай больше вопросов`,
    inputSchema: z.object({
      reason: z
        .string()
        .optional()
        .describe("Причина завершения (опционально)"),
      finalMessage: z
        .string()
        .optional()
        .describe("Финальное сообщение кандидату (опционально)"),
    }),
    execute: async (args: Record<string, unknown>) => {
      const { reason, finalMessage } = args as {
        reason?: string;
        finalMessage?: string;
      };

      try {
        // Получаем данные сессии
        const session = await db.query.interviewSession.findFirst({
          where: eq(interviewSession.id, sessionId),
        });

        if (!session) {
          return {
            success: false,
            error: "Interview session not found",
          };
        }

        // Проверяем, не завершено ли уже интервью
        if (session.status === "completed") {
          return {
            success: false,
            error: "Interview already completed",
          };
        }

        // Получаем responseId
        const responseRecord = await db.query.response.findFirst({
          where: eq(response.id, session.responseId),
        });

        if (!responseRecord) {
          return {
            success: false,
            error: "Response record not found",
          };
        }

        // Получаем последние сообщения для транскрипции
        const recentMessages = await db
          .select()
          .from(interviewMessage)
          .where(eq(interviewMessage.sessionId, sessionId))
          .orderBy(desc(interviewMessage.createdAt))
          .limit(10);

        const transcription = recentMessages
          .reverse()
          .map(
            (m) =>
              `${m.role === "user" ? "Кандидат" : "Интервьюер"}: ${m.content}`,
          )
          .join("\n");

        // Получаем количество вопросов
        const metadata = await getInterviewSessionMetadata(sessionId);
        const questionNumber = metadata.questionAnswers?.length ?? 0;

        // Определяем gigResponseId если это gig
        const gigResponseId =
          responseRecord.entityType === "gig" ? responseRecord.id : undefined;
        const vacancyResponseId =
          responseRecord.entityType === "vacancy"
            ? responseRecord.id
            : undefined;

        // Отправляем событие в inngest для создания скоринга ПЕРЕД обновлением метаданных
        await inngest.send({
          name: "web/interview.complete",
          data: {
            chatSessionId: sessionId,
            transcription,
            reason: reason ?? "Интервью завершено",
            questionNumber,
            responseId: vacancyResponseId,
            gigResponseId,
          },
        });

        // Обновляем метаданные ТОЛЬКО после успешной отправки события
        await updateInterviewSessionMetadata(sessionId, {
          interviewCompleted: true,
          completedAt: new Date().toISOString(),
          interviewState: {
            ...metadata.interviewState,
            stage: "wrapup",
            updatedAt: new Date().toISOString(),
          },
        });

        console.log("✅ Interview completion event sent", {
          sessionId,
          responseId: responseRecord.id,
          entityType: responseRecord.entityType,
          questionNumber,
        });

        return {
          success: true,
          message: finalMessage ?? "Интервью успешно завершено",
          questionNumber,
          entityType: responseRecord.entityType,
        };
      } catch (error) {
        console.error("❌ Failed to complete interview:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  });
}
