import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  bufferedTempInterviewMessage,
  interviewMessage,
  tempInterviewMessage,
} from "@qbs-autonaim/db/schema";
import {
  type BufferedTempMessageData,
  tempMessageBufferService,
} from "@qbs-autonaim/jobs/services/buffer";
import { removeNullBytes } from "@qbs-autonaim/lib";

/**
 * Сохраняет временное сообщение для неидентифицированного пользователя
 */
export async function saveTempMessage(params: {
  tempConversationId: string;
  chatId: string;
  sender: "CANDIDATE" | "BOT";
  content: string;
  contentType?: "TEXT" | "VOICE";
  externalMessageId?: string;
}) {
  const {
    tempConversationId,
    chatId,
    sender,
    content,
    contentType = "TEXT",
    externalMessageId,
  } = params;

  try {
    await db.insert(tempInterviewMessage).values({
      tempSessionId: tempConversationId,
      chatId,
      sender,
      contentType,
      content: removeNullBytes(content),
      externalMessageId,
    });

    console.log("✅ Временное сообщение сохранено", {
      tempConversationId,
      sender,
      contentType,
    });
  } catch (error) {
    console.error("❌ Ошибка сохранения временного сообщения:", {
      tempConversationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Переносит буферизованные сообщения в постоянное хранилище temp_conversation_messages
 */
export async function flushTempMessageBuffer(
  tempConversationId: string,
): Promise<void> {
  try {
    const bufferedMessages = await tempMessageBufferService.getMessages({
      tempConversationId,
    });

    if (bufferedMessages.length === 0) {
      console.log("Нет буферизованных сообщений для переноса", {
        tempConversationId,
      });
      return;
    }

    // Validate and extract chatId from tempConversationId
    if (!tempConversationId.startsWith("temp_")) {
      throw new Error(
        `Invalid tempConversationId format: expected "temp_" prefix, got "${tempConversationId}"`,
      );
    }

    const chatId = tempConversationId.slice(5); // Remove "temp_" prefix (5 characters)

    // Валидация числового chatId (Telegram ID)
    if (!chatId || !/^-?\d+$/.test(chatId)) {
      throw new Error(
        `Невалидный chatId извлечён из tempConversationId: "${chatId}"`,
      );
    }

    await db.transaction(async (tx) => {
      const messagesToInsert = bufferedMessages.map(
        (msg: BufferedTempMessageData) => ({
          tempSessionId: tempConversationId,
          chatId,
          sender: msg.sender,
          contentType: msg.contentType,
          content: removeNullBytes(msg.content),
          externalMessageId: msg.externalMessageId,
        }),
      );

      await tx.insert(tempInterviewMessage).values(messagesToInsert);

      // Clear buffer within the same transaction to ensure atomicity
      await tx
        .delete(bufferedTempInterviewMessage)
        .where(
          eq(bufferedTempInterviewMessage.tempSessionId, tempConversationId),
        );
    });

    console.log(
      "✅ Буферизованные сообщения перенесены в temp_conversation_messages",
      {
        tempConversationId,
        count: bufferedMessages.length,
      },
    );
  } catch (error) {
    console.error("❌ Ошибка переноса буферизованных сообщений:", {
      tempConversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Переносит временные сообщения в основную таблицу после идентификации
 */
export async function migrateTempMessages(
  tempConversationId: string,
  realInterviewSessionId: string,
) {
  try {
    await db.transaction(async (tx) => {
      // Получаем все временные сообщения
      const tempMessages = await tx
        .select()
        .from(tempInterviewMessage)
        .where(eq(tempInterviewMessage.tempSessionId, tempConversationId))
        .orderBy(tempInterviewMessage.createdAt);

      if (tempMessages.length === 0) {
        console.log("Нет временных сообщений для переноса", {
          tempConversationId,
        });
        return;
      }

      // Переносим в основную таблицу одним batch insert
      const messagesToInsert = tempMessages.map((msg) => ({
        sessionId: realInterviewSessionId,
        role: (msg.sender === "CANDIDATE" ? "user" : "assistant") as
          | "user"
          | "assistant",
        type: (msg.contentType === "VOICE" ? "voice" : "text") as
          | "text"
          | "voice",
        content: removeNullBytes(msg.content),
        externalId: msg.externalMessageId ?? undefined,
        channel: "telegram" as const,
      }));

      await tx.insert(interviewMessage).values(messagesToInsert);

      // Удаляем временные сообщения
      await tx
        .delete(tempInterviewMessage)
        .where(eq(tempInterviewMessage.tempSessionId, tempConversationId));

      console.log("✅ Временные сообщения перенесены", {
        tempConversationId,
        realInterviewSessionId,
        count: tempMessages.length,
      });
    });
  } catch (error) {
    console.error("❌ Ошибка переноса временных сообщений:", {
      tempConversationId,
      realInterviewSessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error; // Пробрасываем ошибку для retry handling
  }
}

/**
 * Получает историю временных сообщений
 */
export async function getTempMessageHistory(tempConversationId: string) {
  try {
    return await db
      .select()
      .from(tempInterviewMessage)
      .where(eq(tempInterviewMessage.tempSessionId, tempConversationId))
      .orderBy(tempInterviewMessage.createdAt);
  } catch (error) {
    console.error("❌ Ошибка получения временных сообщений:", {
      tempConversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
