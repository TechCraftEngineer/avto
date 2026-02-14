/**
 * Send Message Procedure
 *
 * Отправляет сообщение от кандидата в диалог преквалификации.
 * Публичная процедура - не требует авторизации пользователя.
 */

import { generateText } from "@qbs-autonaim/lib/ai";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  DialogueHandler,
  SessionManager,
} from "../../services/prequalification";
import { PrequalificationError } from "../../services/prequalification/types";
import { publicProcedure } from "../../trpc";

const sendMessageInputSchema = z.object({
  sessionId: z.string().uuid("sessionId должен быть UUID"),
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  message: z
    .string()
    .min(1, "message обязателен")
    .max(5000, "Сообщение слишком длинное"),
});

export const sendMessage = publicProcedure
  .input(sendMessageInputSchema)
  .mutation(async ({ ctx, input }) => {
    const sessionManager = new SessionManager(ctx.db);
    const dialogueHandler = new DialogueHandler(ctx.db);

    // Verify session exists and is in dialogue_active status
    const session = await sessionManager.getSession(
      input.sessionId,
      input.workspaceId,
    );

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сессия не найдена",
      });
    }

    if (session.status !== "dialogue_active") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Отправка сообщений недоступна в статусе: ${session.status}`,
      });
    }

    try {
      // Get workspace config
      const config = await sessionManager.getWorkspaceConfig(input.workspaceId);

      // Get or create interviewSession
      let interviewSessionId = session.interviewSessionId;
      if (!interviewSessionId) {
        const candidateName =
          session.parsedResume?.structured?.personalInfo?.name;
        interviewSessionId = await dialogueHandler.createInterviewSession(
          input.sessionId,
          input.workspaceId,
          candidateName ?? undefined,
        );
      }

      // Get dialogue context
      const dialogueContext = await dialogueHandler.getDialogueContext(
        input.sessionId,
        input.workspaceId,
        config,
      );

      // Save user message
      await dialogueHandler.saveMessage(
        interviewSessionId,
        input.message,
        "user",
      );

      // Check if this is the first message (need welcome message first)
      const isFirstExchange = dialogueContext.conversationHistory.length === 0;

      // Build AI prompt
      const prompt = buildDialoguePrompt(
        dialogueContext,
        input.message,
        config,
        isFirstExchange,
      );

      // Generate AI response
      const { text: aiResponse } = await generateText({
        prompt,
        generationName: "prequalification-dialogue",
        metadata: {
          sessionId: input.sessionId,
          vacancyId: dialogueContext.vacancyId,
        },
      });

      // Save AI response
      await dialogueHandler.saveMessage(
        interviewSessionId,
        aiResponse,
        "assistant",
      );

      // Update conversation history for checks
      const updatedHistory = [
        ...dialogueContext.conversationHistory,
        {
          role: "user" as const,
          content: input.message,
          timestamp: new Date(),
        },
        {
          role: "assistant" as const,
          content: aiResponse,
          timestamp: new Date(),
        },
      ];

      // Check mandatory questions
      const mandatoryCheck = dialogueHandler.checkMandatoryQuestions(
        updatedHistory,
        config.mandatoryQuestions,
      );

      // Check if dialogue is sufficient for evaluation
      const isSufficient = dialogueHandler.isDialogueSufficient(
        updatedHistory,
        config,
      );
      const dialogueComplete = isSufficient && mandatoryCheck.allAsked;

      // If dialogue is complete, transition to evaluating
      let newStatus: "dialogue_active" | "evaluating" =
        session.status as "dialogue_active";
      if (dialogueComplete) {
        await sessionManager.updateSessionStatus(
          input.sessionId,
          input.workspaceId,
          "evaluating",
        );
        newStatus = "evaluating";
      }

      return {
        response: {
          message: aiResponse,
          isComplete: dialogueComplete,
          nextQuestion: dialogueComplete
            ? undefined
            : extractNextQuestion(aiResponse),
        },
        status: newStatus,
        dialogueComplete,
        mandatoryQuestionsAsked: mandatoryCheck.askedQuestions,
        mandatoryQuestionsMissing: mandatoryCheck.missingQuestions,
      };
    } catch (error) {
      if (error instanceof PrequalificationError) {
        const codeMap: Record<
          string,
          "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR"
        > = {
          SESSION_NOT_FOUND: "NOT_FOUND",
          INVALID_STATE_TRANSITION: "BAD_REQUEST",
          TENANT_MISMATCH: "FORBIDDEN",
          INTERVIEW_SESSION_CREATION_FAILED: "INTERNAL_SERVER_ERROR",
        };

        throw new TRPCError({
          code: codeMap[error.code] ?? "INTERNAL_SERVER_ERROR",
          message: error.userMessage,
          cause: error,
        });
      }

      throw error;
    }
  });

/**
 * Builds the AI prompt for dialogue
 */
function buildDialoguePrompt(
  context: Awaited<ReturnType<DialogueHandler["getDialogueContext"]>>,
  userMessage: string,
  config: Awaited<ReturnType<SessionManager["getWorkspaceConfig"]>>,
  isFirstExchange: boolean,
): string {
  const toneInstruction =
    config.tone === "formal"
      ? "Используй формальный, деловой стиль общения. Обращайся на 'Вы'."
      : "Используй дружелюбный, но профессиональный стиль. Можно обращаться на 'ты'.";

  const resumeInfo = context.parsedResume?.structured
    ? `
РЕЗЮМЕ КАНДИДАТА:
Имя: ${context.parsedResume.structured.personalInfo?.name ?? "Не указано"}
Опыт: ${context.parsedResume.structured.experience?.map((e) => `${e.position} в ${e.company}`).join(", ") ?? "Не указан"}
Навыки: ${context.parsedResume.structured.skills?.join(", ") ?? "Не указаны"}
`
    : "";

  const historyText = context.conversationHistory
    .map(
      (msg) =>
        `${msg.role === "assistant" ? "AI" : "Кандидат"}: ${msg.content}`,
    )
    .join("\n\n");

  const mandatoryQuestionsText =
    config.mandatoryQuestions.length > 0
      ? `\nОБЯЗАТЕЛЬНЫЕ ВОПРОСЫ (задай их в ходе диалога):\n${config.mandatoryQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

  return `Ты — AI-ассистент по подбору персонала, проводящий преквалификацию кандидата.

${toneInstruction}

ВАКАНСИЯ:
Название: ${context.vacancyTitle}
Описание: ${context.vacancyDescription ?? "Не указано"}
${context.vacancyRequirements ? `Требования: ${JSON.stringify(context.vacancyRequirements)}` : ""}

${resumeInfo}
${mandatoryQuestionsText}

${historyText ? `ИСТОРИЯ ДИАЛОГА:\n${historyText}\n` : ""}

ТЕКУЩЕЕ СООБЩЕНИЕ КАНДИДАТА:
${userMessage}

ЗАДАЧА:
${
  isFirstExchange
    ? "Это начало диалога. Поприветствуй кандидата, поблагодари за интерес к вакансии и задай первый вопрос для оценки соответствия."
    : "Продолжи диалог. Отреагируй на ответ кандидата и задай следующий релевантный вопрос для оценки соответствия вакансии."
}

Максимум сообщений в диалоге: ${config.maxDialogueTurns}. Текущее количество обменов: ${Math.floor(context.conversationHistory.length / 2) + 1}.

ТРЕБОВАНИЯ К ОТВЕТУ:
1. Отвечай кратко и по делу (2-4 предложения)
2. Задавай один конкретный вопрос за раз
3. Не повторяй уже заданные вопросы
4. Фокусируйся на оценке соответствия требованиям вакансии

ОТВЕТ (только текст ответа, без дополнительных комментариев):`;
}

/**
 * Extracts the next question from AI response
 */
function extractNextQuestion(response: string): string | undefined {
  // Try to find a question in the response
  const questionMatch = response.match(/[^.!]*\?/);
  return questionMatch ? questionMatch[0].trim() : undefined;
}
