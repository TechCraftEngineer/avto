/**
 * Публичный endpoint для AI-чата интервью
 * Доступен без авторизации, но защищён проверкой interviewSessionId
 * Только для WEB интервью (lastChannel = 'web')
 *
 * Использует мультиагентную систему с поддержкой стриминга
 * Трассировка через Langfuse
 */

import { observe, updateActiveTrace } from "@langfuse/tracing";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { WebInterviewOrchestrator } from "@qbs-autonaim/ai";
import { db } from "@qbs-autonaim/db/client";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import "@qbs-autonaim/lib/instrumentation";
import { InterviewSDKError } from "@qbs-autonaim/lib/errors";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkInterviewAccess, loadInterviewSession } from "./access-control";
import { loadInterviewContext } from "./context-loader";
import {
  buildConversationHistory,
  formatMessagesForModel,
} from "./conversation-builder";
import { errorToResponse } from "./error-adapter";
import {
  extractMessageText,
  hasVoiceFile,
  saveAssistantMessages,
  saveUserMessage,
} from "./message-handler";
import { requestSchema } from "./schema";
import type { StageId } from "./stages/types";
import { VALID_STAGES } from "./stages/types";
import { getInterviewStrategy } from "./strategies";
import { executeStreamWithFallbackV6 } from "./stream-executor";

export const maxDuration = 60;

function generateUUID(): string {
  return crypto.randomUUID();
}

async function handler(request: Request) {
  let requestBody: z.infer<typeof requestSchema>;

  // Контекст для логирования ошибок
  const errorContext: {
    sessionId?: string;
    entityType?: string;
    currentStage?: string;
    lastQuestion?: string;
    vacancyId?: string;
    gigId?: string;
  } = {};

  try {
    const json = await request.json();
    requestBody = requestSchema.parse(json);
  } catch (error) {
    console.error("[Interview Stream] Ошибка парсинга:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверный запрос", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  try {
    const { messages, message, sessionId, interviewToken } = requestBody;

    // Сохраняем sessionId для логирования ошибок
    errorContext.sessionId = sessionId;

    // Проверка доступа
    await checkInterviewAccess(sessionId, interviewToken, db);

    // Загрузка сессии
    const session = await loadInterviewSession(sessionId, db);

    // Загрузка контекста вакансии/задания
    const { vacancy, gig, companySettings } = await loadInterviewContext(
      session.responseId,
      db,
    );

    // Создаём стратегию на основе типа сущности
    const strategy = getInterviewStrategy(gig ?? null, vacancy ?? null);

    // Получаем текущую стадию из метаданных сессии и валидируем
    const currentStageRaw = (session.metadata as { currentStage?: string })
      ?.currentStage;
    const isValidStageId = (stage: string | undefined): stage is StageId =>
      VALID_STAGES.includes(stage as StageId);
    const currentStage: StageId = isValidStageId(currentStageRaw)
      ? currentStageRaw
      : "intro";

    // Сохраняем контекст для логирования ошибок
    errorContext.entityType = strategy.entityType;
    errorContext.currentStage = currentStage;
    errorContext.vacancyId = vacancy?.id;
    errorContext.gigId = gig?.id;

    // Определяем тип запроса
    const isToolApprovalFlow = Boolean(messages);

    // Получаем последнее сообщение пользователя
    const lastUserMessage = isToolApprovalFlow
      ? messages?.filter((m) => m.role === "user").pop()
      : message;

    const userMessageText = lastUserMessage
      ? extractMessageText(lastUserMessage)
      : "";

    // Сохраняем последний вопрос для логирования ошибок (редактируем PII)
    const sanitizeForLogging = (text: string): string => {
      // Удаляем email адреса
      let sanitized = text.replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        "[EMAIL]",
      );
      // Удаляем телефоны
      sanitized = sanitized.replace(/\+?\d[\d\s\-()]{7,}\d/g, "[PHONE]");
      // Обрезаем до 200 символов
      if (sanitized.length > 200) {
        sanitized = `${sanitized.substring(0, 200)}...`;
      }
      return sanitized;
    };
    errorContext.lastQuestion = sanitizeForLogging(userMessageText);

    // Сохраняем текстовое сообщение пользователя
    const savedMessageTimestamp = await saveUserMessage(
      sessionId,
      userMessageText,
      lastUserMessage ? hasVoiceFile(lastUserMessage) : false,
      db,
    );

    // Устанавливаем метаданные для трассировки
    updateActiveTrace({
      name: "web-interview-chat",
      userId: sessionId,
      sessionId: sessionId,
      metadata: {
        source: "WEB",
        vacancyId: vacancy?.id,
        gigId: gig?.id,
        entityType: strategy.entityType,
        currentStage,
      },
    });

    // Создаём оркестратор
    const model = getAIModel();
    const orchestrator = new WebInterviewOrchestrator({ model });

    // Формируем историю диалога
    const conversationHistory = buildConversationHistory(
      session.messages,
      userMessageText,
      savedMessageTimestamp,
    );

    // Определяем, это первый ответ после приветствия
    const existingUserMessageCount = session.messages.filter(
      (m: { role: string }) => m.role === "user",
    ).length;
    const isFirstResponse = existingUserMessageCount === 0;

    // Анализируем контекст сообщения
    const contextAnalysis = await orchestrator.execute(
      {
        message: userMessageText,
        history: conversationHistory,
      },
      { conversationHistory },
    );

    if (!contextAnalysis.success || !contextAnalysis.data) {
      console.error(
        "[Interview Stream] Ошибка анализа контекста:",
        contextAnalysis.error,
      );
      return NextResponse.json({
        acknowledged: false,
        error: "context analysis failed",
      });
    }

    // Логируем эскалацию
    if (contextAnalysis.data.shouldEscalate) {
      console.warn("[Interview Stream] Требуется эскалация:", {
        conversationId: sessionId,
        reason: contextAnalysis.data.escalationReason,
      });
    }

    // Формируем контекст для стратегии
    const interviewContext = {
      candidateName:
        (session.metadata as { candidateName?: string })?.candidateName || null,
      botSettings: companySettings
        ? {
            botName: companySettings.botName || undefined,
            botRole: companySettings.botRole || undefined,
            companyName: companySettings.name,
          }
        : undefined,
    };

    // Создаём инструменты через стратегию
    const tools = strategy.createTools(
      model,
      sessionId,
      db,
      gig ?? null,
      vacancy ?? null,
      interviewContext,
      currentStage,
    );

    // Строим системный промпт через стратегию с передачей всех параметров
    const entity = gig ?? vacancy ?? null;

    // Извлекаем уже заданные вопросы из метаданных сессии
    const askedQuestions = (
      (session.metadata as { askedQuestions?: string[] })?.askedQuestions || []
    ).slice(-10); // Берём последние 10 вопросов

    const systemPrompt = strategy.systemPromptBuilder.build(
      isFirstResponse,
      currentStage,
      entity,
      interviewContext.botSettings,
      askedQuestions,
    );

    // Получаем список активных инструментов для текущей стадии
    const activeTools = strategy.toolFactory.getAvailableTools(currentStage);

    const formattedMessages = formatMessagesForModel(
      session.messages,
      userMessageText,
    );

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          const result = executeStreamWithFallbackV6({
            systemPrompt,
            messages: formattedMessages,
            tools,
            sessionId,
            activeTools,
            telemetryMetadata: {
              entityType: strategy.entityType,
              vacancyId: vacancy?.id,
              gigId: gig?.id,
              currentStage,
            },
            onPrepareStep: async (stepNumber) => {
              console.log(`[Interview Stream] Начало шага ${stepNumber}`, {
                sessionId,
                entityType: strategy.entityType,
                currentStage,
                timestamp: new Date().toISOString(),
              });
            },
            onStepFinish: async ({ toolCalls }) => {
              if (toolCalls.length > 0) {
                console.log(
                  `[Interview Stream] Шаг завершён, вызваны инструменты:`,
                  {
                    sessionId,
                    entityType: strategy.entityType,
                    currentStage,
                    toolCalls: toolCalls.map((tc) => ({
                      toolName: tc.toolName,
                    })),
                    timestamp: new Date().toISOString(),
                  },
                );
              }
            },
          });

          writer.merge(result.toUIMessageStream());
        } catch (error) {
          // Игнорируем ошибки закрытого соединения
          if (
            error instanceof Error &&
            (error.message.includes("terminated") ||
              error.message.includes("UND_ERR_SOCKET") ||
              error.message.includes("other side closed") ||
              error.name === "AbortError")
          ) {
            console.log("[Interview Stream] Соединение закрыто клиентом", {
              sessionId,
            });
            return;
          }
          throw error;
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        await saveAssistantMessages(sessionId, finishedMessages, db);
      },
      onError: (error) => {
        // Игнорируем ошибки закрытого соединения
        if (
          error instanceof Error &&
          (error.message.includes("terminated") ||
            error.message.includes("UND_ERR_SOCKET") ||
            error.message.includes("other side closed") ||
            error.name === "AbortError")
        ) {
          console.log("[Interview Stream] Соединение закрыто клиентом");
          return "Соединение прервано";
        }
        console.error("[Interview Stream] Ошибка:", error);
        return error instanceof Error ? error.message : "Неизвестная ошибка";
      },
    });

    return createUIMessageStreamResponse({
      stream,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    // Логируем ошибку с полным стеком и контекстом
    console.error("[Interview Stream] Ошибка:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
      context: {
        sessionId: errorContext.sessionId,
        entityType: errorContext.entityType,
        currentStage: errorContext.currentStage,
        lastQuestion: errorContext.lastQuestion,
        vacancyId: errorContext.vacancyId,
        gigId: errorContext.gigId,
      },
      timestamp: new Date().toISOString(),
    });

    trace.getActiveSpan()?.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    trace.getActiveSpan()?.end();

    if (error instanceof InterviewSDKError) {
      return errorToResponse(error);
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}

// Wrap handler with observe() to create a Langfuse trace
export const POST = observe(handler, {
  name: "interview-chat-stream",
  endOnExit: false,
});
