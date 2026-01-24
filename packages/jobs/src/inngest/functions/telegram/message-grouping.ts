/**
 * Механизм группировки сообщений от кандидата
 *
 * Проблема: кандидат может отправить несколько сообщений подряд (текст/голос в любом порядке),
 * а бот реагирует на каждое отдельно, создавая хаос.
 *
 * Решение: Собираем все сообщения кандидата в течение 10 минут.
 * Ждем 10 минут после последнего сообщения кандидата, затем обрабатываем всю группу.
 */

import { and, desc, eq, gte } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { interviewMessage } from "@qbs-autonaim/db/schema";
import { MESSAGE_GROUPING_CONFIG } from "./message-grouping.config";

const GROUPING_WINDOW_MINUTES = 10;
// Буфер для запроса сообщений - чтобы не потерять сообщения при задержке обработки
const QUERY_BUFFER_MINUTES = 5;

interface MessageGroup {
  chatSessionId: string;
  messages: Array<{
    id: string;
    content: string;
    contentType: "text" | "voice";
    createdAt: Date;
  }>;
  shouldProcess: boolean;
  reason?: string;
}

/**
 * Проверяет, нужно ли ждать еще сообщений или можно обрабатывать группу
 *
 * Простая группировка: собираем все сообщения кандидата за последние 10 минут
 * Ждем 10 минут после последнего сообщения, затем обрабатываем всю группу
 */
export async function shouldProcessMessageGroup(
  chatSessionId: string,
  currentMessageId: string,
): Promise<MessageGroup> {
  // Проверяем, включена ли группировка
  if (!MESSAGE_GROUPING_CONFIG.ENABLE_GROUPING) {
    return {
      chatSessionId,
      messages: [],
      shouldProcess: true,
      reason: "grouping disabled",
    };
  }

  const now = new Date();
  const groupingWindowMs = GROUPING_WINDOW_MINUTES * 60 * 1000;
  // Запрашиваем с буфером, чтобы не потерять сообщения при задержке обработки
  const queryWindowMs =
    (GROUPING_WINDOW_MINUTES + QUERY_BUFFER_MINUTES) * 60 * 1000;
  const windowStartTime = new Date(now.getTime() - queryWindowMs);

  // Получаем все сообщения кандидата за последние 10+5 минут (с буфером)
  const recentMessages = await db.query.interviewMessage.findMany({
    where: and(
      eq(interviewMessage.sessionId, chatSessionId),
      eq(interviewMessage.role, "user"),
      gte(interviewMessage.createdAt, windowStartTime),
    ),
    orderBy: [desc(interviewMessage.createdAt)],
  });

  if (recentMessages.length === 0) {
    return {
      chatSessionId,
      messages: [],
      shouldProcess: true,
      reason: "no recent messages",
    };
  }

  // Находим текущее сообщение
  const currentMessage = recentMessages.find(
    (m) => m.externalId === currentMessageId,
  );

  if (!currentMessage) {
    return {
      chatSessionId,
      messages: [],
      shouldProcess: true,
      reason: "current message not found",
    };
  }

  // Проверяем, есть ли более новые сообщения
  const newerMessages = recentMessages.filter(
    (m) => m.createdAt > currentMessage.createdAt,
  );

  if (newerMessages.length > 0) {
    // Есть более новые сообщения - текущее не последнее, пропускаем
    return {
      chatSessionId,
      messages: [],
      shouldProcess: false,
      reason: "newer messages exist",
    };
  }

  // Текущее сообщение - последнее. Проверяем, прошло ли 10 минут
  const timeSinceLastMessage =
    now.getTime() - currentMessage.createdAt.getTime();
  const hasWaitedEnough = timeSinceLastMessage >= groupingWindowMs;

  if (!hasWaitedEnough) {
    const minutesWaited = Math.round(timeSinceLastMessage / 60000);
    return {
      chatSessionId,
      messages: [],
      shouldProcess: false,
      reason: `waiting for ${GROUPING_WINDOW_MINUTES} minutes (${minutesWaited}/${GROUPING_WINDOW_MINUTES} min)`,
    };
  }

  // Финальная проверка: убедимся что не пришло новое сообщение пока мы ждали
  const finalCheck = await db.query.interviewMessage.findFirst({
    where: and(
      eq(interviewMessage.sessionId, chatSessionId),
      eq(interviewMessage.role, "user"),
    ),
    orderBy: [desc(interviewMessage.createdAt)],
  });

  if (
    finalCheck &&
    finalCheck.externalId !== currentMessageId &&
    finalCheck.createdAt > currentMessage.createdAt
  ) {
    return {
      chatSessionId,
      messages: [],
      shouldProcess: false,
      reason: "newer message arrived during wait",
    };
  }

  // Проверяем голосовые без транскрипции
  const voiceMessagesWithoutTranscription = recentMessages.filter(
    (m) => m.type === "voice" && !m.voiceTranscription,
  );

  if (voiceMessagesWithoutTranscription.length > 0) {
    return {
      chatSessionId,
      messages: [],
      shouldProcess: false,
      reason: `waiting for voice transcription (${voiceMessagesWithoutTranscription.length} pending)`,
    };
  }

  // Собираем все сообщения за последние 10 минут
  const groupMessages = recentMessages
    .reverse() // От старых к новым
    .map((m) => ({
      id: m.externalId || m.id,
      content:
        m.type === "voice" && m.voiceTranscription
          ? m.voiceTranscription
          : m.content || "",
      contentType: m.type as "text" | "voice",
      createdAt: m.createdAt,
    }));

  return {
    chatSessionId,
    messages: groupMessages,
    shouldProcess: true,
    reason: `group ready (${groupMessages.length} messages in ${GROUPING_WINDOW_MINUTES} min window)`,
  };
}

/**
 * Форматирует группу сообщений для передачи в AI
 */
export function formatMessageGroup(
  messages: Array<{
    id: string;
    content: string;
    contentType: "text" | "voice";
    createdAt: Date | string;
  }>,
): string {
  if (messages.length === 0) return "";
  if (messages.length === 1) return messages[0]?.content || "";

  // Несколько сообщений - объединяем с указанием типа
  return messages
    .map((m, idx) => {
      const prefix = m.contentType === "voice" ? "🎤 Голосовое" : "💬 Текст";
      return `${prefix} ${idx + 1}: ${m.content}`;
    })
    .join("\n\n");
}
