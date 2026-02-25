import { env } from "@qbs-autonaim/config";
import type { MessageData } from "../schemas/message-data.schema";

/**
 * Отправить событие транскрибации в Inngest
 */
export async function triggerTranscription(
  messageId: string,
  fileId: string,
): Promise<void> {
  if (!env.INNGEST_EVENT_KEY) {
    console.warn("⚠️ INNGEST_EVENT_KEY не установлен, событие не отправлено");
    return;
  }

  await fetch(`${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "telegram/voice.transcribe",
      data: {
        messageId,
        fileId,
      },
    }),
  });
}

/**
 * Отправить событие отправки сообщения в Inngest по username
 */
export async function triggerMessageSend(
  messageId: string,
  username: string,
  content: string,
  workspaceId: string,
): Promise<void> {
  if (!env.INNGEST_EVENT_KEY) {
    console.warn("⚠️ INNGEST_EVENT_KEY не установлен, событие не отправлено");
    return;
  }

  await fetch(`${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "telegram/message.send.by-username",
      data: {
        messageId,
        username,
        content,
        workspaceId,
      },
    }),
  });
}

/**
 * Отправить событие обработки входящего сообщения в Inngest (workspace)
 */
export async function triggerIncomingMessage(
  workspaceId: string,
  messageData: MessageData,
): Promise<void> {
  if (!env.INNGEST_EVENT_KEY) {
    console.warn("⚠️ INNGEST_EVENT_KEY не установлен, событие не отправлено");
    return;
  }

  await fetch(`${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "telegram/message.received",
      data: {
        workspaceId,
        messageData,
      },
    }),
  });
}

/**
 * Отправить событие входящего сообщения личного Telegram (ручной чат, без AI-интервью)
 */
export async function triggerPersonalIncomingMessage(
  userId: string,
  messageData: MessageData,
): Promise<void> {
  if (!env.INNGEST_EVENT_KEY) {
    console.warn("⚠️ INNGEST_EVENT_KEY не установлен, событие не отправлено");
    return;
  }

  await fetch(`${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "telegram/personal.message.received",
      data: {
        userId,
        messageData,
      },
    }),
  });
}
