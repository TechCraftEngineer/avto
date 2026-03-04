import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { withFloodWaitRetry } from "./flood-wait";

/**
 * Получить историю сообщений из чата
 */
export async function getChatHistory(
  client: TelegramClient,
  chatId: number,
  limit = 20,
): Promise<
  Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
    contentType?: "TEXT" | "VOICE";
  }>
> {
  try {
    const messages: Message[] = [];

    for await (const msg of client.iterHistory(chatId, { limit })) {
      messages.push(msg);
    }

    // Получаем ID бота для определения отправителя
    const me = await client.getMe();
    const botId = me.id;

    return messages
      .reverse()
      .filter((msg) => msg.text || (msg.media && msg.media.type === "voice"))
      .map((msg) => ({
        sender: msg.sender?.id === botId ? "BOT" : "CANDIDATE",
        content:
          msg.media && msg.media.type === "voice"
            ? "Голосовое сообщение"
            : msg.text || "",
        contentType:
          msg.media && msg.media.type === "voice"
            ? ("VOICE" as const)
            : ("TEXT" as const),
      }));
  } catch (error) {
    console.error("Ошибка при получении истории чата:", error);
    return [];
  }
}

/** Ошибки Telegram, при которых чат недоступен — не логируем как критичную ошибку */
const PEER_UNAVAILABLE_ERRORS = [
  "PEER_ID_INVALID",
  "CHANNEL_INVALID",
  "CHAT_INVALID",
  "USER_INVALID",
];

function isPeerUnavailableError(error: unknown): boolean {
  const fromText =
    error &&
    typeof error === "object" &&
    "text" in error &&
    (() => {
      const text = (error as { text?: unknown }).text;
      return (
        typeof text === "string" &&
        PEER_UNAVAILABLE_ERRORS.some((code) => text.includes(code))
      );
    })();

  const fromMessage =
    error instanceof Error &&
    PEER_UNAVAILABLE_ERRORS.some((code) => error.message.includes(code));

  return Boolean(fromText || fromMessage);
}

/**
 * Отметить сообщения как прочитанные
 */
export async function markRead(
  client: TelegramClient,
  chatId: number,
): Promise<void> {
  try {
    await withFloodWaitRetry(async () => {
      const peer = await client.resolvePeer(chatId);
      return await client.call({
        _: "messages.readHistory",
        peer,
        maxId: 0,
      });
    });
  } catch (error) {
    if (isPeerUnavailableError(error)) {
      // Чат недоступен (удалён, заблокирован, мигрирован) — пропускаем тихо
      return;
    }
    console.error("Ошибка при отметке сообщений как прочитанных:", error);
  }
}

/**
 * Показать индикатор печати
 */
export async function showTyping(
  client: TelegramClient,
  chatId: number,
): Promise<void> {
  await withFloodWaitRetry(async () => {
    const peer = await client.resolvePeer(chatId);
    return await client.call({
      _: "messages.setTyping",
      peer,
      action: { _: "sendMessageTypingAction" },
    });
  });
}

/**
 * Показать индикатор записи аудио
 */
export async function showRecordingAudio(
  client: TelegramClient,
  chatId: number,
): Promise<void> {
  await withFloodWaitRetry(async () => {
    const peer = await client.resolvePeer(chatId);
    return await client.call({
      _: "messages.setTyping",
      peer,
      action: { _: "sendMessageRecordAudioAction" },
    });
  });
}
