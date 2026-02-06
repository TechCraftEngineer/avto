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
import { getAIModel, streamText } from "@qbs-autonaim/lib/ai";
import "@qbs-autonaim/lib/instrumentation";
import { InterviewSDKError } from "@qbs-autonaim/lib/errors";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkInterviewAccess, loadInterviewSession } from "./access-control";
import { loadInterviewContext } from "./context-loader";
import {
  buildConversationHistory,
  formatMessagesForModel,
} from "./conversation-builder";
import { errorToResponse } from "./error-adapter";
import { createWebInterviewRuntime } from "./interview-runtime";
import {
  extractMessageText,
  hasVoiceFile,
  saveAssistantMessages,
  saveUserMessage,
} from "./message-handler";
import { requestSchema } from "./schema";

export const maxDuration = 60;

function generateUUID(): string {
  return crypto.randomUUID();
}

async function handler(request: Request) {
  let requestBody: z.infer<typeof requestSchema>;

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

    // Проверка доступа
    await checkInterviewAccess(sessionId, interviewToken, db);

    // Загрузка сессии
    const session = await loadInterviewSession(sessionId, db);

    // Загрузка контекста вакансии/задания
    const { vacancy, gig, companySettings } = await loadInterviewContext(
      session.responseId,
      db,
    );

    // Определяем тип запроса
    const isToolApprovalFlow = Boolean(messages);

    // Получаем последнее сообщение пользователя
    const lastUserMessage = isToolApprovalFlow
      ? messages?.filter((m) => m.role === "user").pop()
      : message;

    const userMessageText = lastUserMessage
      ? extractMessageText(lastUserMessage)
      : "";

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

    // Формируем контекст для оркестратора
    const interviewContext = {
      conversationId: sessionId,
      candidateName:
        (session.metadata as { candidateName?: string })?.candidateName || null,
      vacancyTitle: vacancy?.title || gig?.title || null,
      vacancyDescription: vacancy?.description || gig?.description || null,
      conversationHistory,
      botSettings: companySettings
        ? {
            botName: companySettings.botName || undefined,
            botRole: companySettings.botRole || undefined,
            companyName: companySettings.name,
          }
        : undefined,
    };

    const { tools, systemPrompt } = createWebInterviewRuntime({
      model,
      sessionId,
      db,
      gig: gig ?? null,
      vacancy: vacancy ?? null,
      interviewContext,
      isFirstResponse,
    });

    const formattedMessages = formatMessagesForModel(
      session.messages,
      userMessageText,
    );

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          model,
          system: systemPrompt,
          messages: formattedMessages,
          tools,
          stopWhen: stepCountIs(25),
          experimental_transform: smoothStream({ chunking: "word" }),
        });

        writer.merge(result.toUIMessageStream());
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        await saveAssistantMessages(sessionId, finishedMessages, db);
      },
      onError: (error) => {
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
    console.error("[Interview Stream] Ошибка:", error);

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
