import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  botSettings,
  interviewMessage,
  interviewSession,
  response,
} from "@qbs-autonaim/db/schema";
import {
  type BufferedTempMessageData,
  tempMessageBufferService,
} from "@qbs-autonaim/jobs/services/buffer";
import { getTempMessageHistory } from "./handlers/unidentified/temp-message-storage";
import type { BotSettings } from "./types";

export function extractPinCode(text: string): string | null {
  const match = text.match(/\b\d{4}\b/);
  return match ? match[0] : null;
}

export async function findDuplicateMessage(
  interviewSessionId: string,
  externalMessageId: string,
): Promise<boolean> {
  const existingMessage = await db.query.interviewMessage.findFirst({
    where: (messages, { and, eq }) =>
      and(
        eq(messages.sessionId, interviewSessionId),
        eq(messages.externalId, externalMessageId),
      ),
  });
  return !!existingMessage;
}

export async function getCompanyBotSettings(
  workspaceId: string,
): Promise<BotSettings> {
  try {
    const bot = await db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, workspaceId),
    });
    return {
      botName: bot?.botName ?? "Дмитрий",
      botRole: bot?.botRole ?? "рекрутер",
    };
  } catch (error) {
    console.error(
      "❌ Ошибка загрузки настроек бота, используем значения по умолчанию",
      {
        workspaceId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return {
      botName: "Дмитрий",
      botRole: "рекрутер",
    };
  }
}

function isValidRole(value: unknown): value is "user" | "assistant" {
  return value === "user" || value === "assistant";
}

function isValidMessageType(value: unknown): value is "text" | "voice" {
  return value === "text" || value === "voice";
}

export async function getChatHistory(chatSessionId: string) {
  if (chatSessionId.startsWith("temp_")) {
    const bufferedMessages = await tempMessageBufferService.getMessages({
      tempConversationId: chatSessionId,
    });

    const tempMessages = await getTempMessageHistory(chatSessionId);

    const allMessages = [
      ...tempMessages.map((msg) => ({
        id: msg.id,
        sessionId: msg.tempSessionId,
        role:
          msg.sender === "CANDIDATE"
            ? "user"
            : ("assistant" as "user" | "assistant"),
        type:
          msg.contentType === "VOICE" ? "voice" : ("text" as "text" | "voice"),
        channel: "telegram" as const,
        content: msg.content,
        fileId: null,
        voiceDuration: null,
        voiceTranscription: null,
        externalId: msg.externalMessageId,
        createdAt: msg.createdAt,
        timestamp: msg.createdAt,
      })),
      ...bufferedMessages.map((msg: BufferedTempMessageData) => ({
        id: msg.id,
        sessionId: chatSessionId,
        role:
          msg.sender === "CANDIDATE"
            ? "user"
            : ("assistant" as "user" | "assistant"),
        type:
          msg.contentType === "VOICE" ? "voice" : ("text" as "text" | "voice"),
        channel: "telegram" as const,
        content: msg.content,
        fileId: null,
        voiceDuration: null,
        voiceTranscription: null,
        externalId: msg.externalMessageId,
        createdAt: msg.timestamp,
        timestamp: msg.timestamp,
      })),
    ];

    return allMessages
      .filter((msg) => {
        const isValid = isValidRole(msg.role) && isValidMessageType(msg.type);
        if (!isValid) {
          console.error("❌ Невалидное временное сообщение, пропускаем", {
            id: msg.id,
            role: msg.role,
            type: msg.type,
          });
        }
        return isValid;
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  const messages = await db.query.interviewMessage.findMany({
    where: eq(interviewMessage.sessionId, chatSessionId),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    limit: 10,
  });

  // Для голосовых сообщений используем транскрибацию вместо "Голосовое сообщение"
  return messages.map((msg) => ({
    ...msg,
    content:
      msg.type === "voice" && msg.voiceTranscription
        ? msg.voiceTranscription
        : msg.content,
    timestamp: msg.createdAt, // Добавляем timestamp для совместимости
  }));
}

/**
 * Находит interviewSession по chatId через связь с response
 */
export async function findInterviewSessionByChatId(chatId: string) {
  // Сначала находим response по chatId
  const resp = await db.query.response.findFirst({
    where: eq(response.chatId, chatId),
  });

  if (!resp) {
    return null;
  }

  // Получаем vacancy для дополнительной информации
  const vacancy = await db.query.vacancy.findFirst({
    where: (v, { eq }) => eq(v.id, resp.entityId),
  });

  // Затем находим interviewSession по responseId
  const session = await db.query.interviewSession.findFirst({
    where: eq(interviewSession.responseId, resp.id),
  });

  if (!session) {
    return null;
  }

  return {
    ...session,
    response: {
      ...resp,
      vacancy: vacancy,
    },
  };
}

/**
 * Создает или возвращает временный ID для неидентифицированного пользователя
 * Используется для хранения сообщений до идентификации по пин-коду
 *
 * ВАЖНО: Возвращает chatId как временный ID, так как chatSession
 * требует обязательный entityId, который мы не можем создать без вакансии.
 * Сообщения будут храниться с этим временным ID до идентификации.
 */
export async function createOrUpdateTempChatSession(
  chatId: string,
  _username?: string,
  _firstName?: string,
): Promise<{ id: string } | null> {
  try {
    // Используем chatId как временный ID для неидентифицированных разговоров
    // Это позволяет сохранять сообщения до идентификации пользователя
    return { id: `temp_${chatId}` };
  } catch (error) {
    console.error("Ошибка создания временного ID:", {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
