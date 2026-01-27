import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  interviewSession,
  response,
} from "@qbs-autonaim/db/schema";
import { logResponseEvent, removeNullBytes } from "@qbs-autonaim/lib";
import type { CommunicationChannel } from "./types";

/**
 * Сохраняет или обновляет interviewSession
 */
export const saveInterviewSession = async (
  responseId: string,
  chatId: string,
  channel: CommunicationChannel,
  sentMessage: string,
  username: string | undefined,
) => {
  // Проверяем, есть ли уже interviewSession для этого response
  const existing = await db.query.interviewSession.findFirst({
    where: eq(interviewSession.responseId, responseId),
  });

  if (existing) {
    // Получаем существующие метаданные
    const existingMetadata = existing.metadata || {};

    // Объединяем с новыми данными
    const updatedMetadata = {
      ...existingMetadata,
      telegramUsername: username,
      telegramChatId: chatId,
      questionAnswers: existingMetadata.questionAnswers || [],
    };

    // Обновляем существующую interviewSession
    await db
      .update(interviewSession)
      .set({
        status: "active",
        lastChannel: channel === "TELEGRAM" ? "telegram" : "web",
        metadata: updatedMetadata,
      })
      .where(eq(interviewSession.id, existing.id));
  } else {
    // Создаем новую interviewSession
    const newMetadata = {
      telegramUsername: username,
      telegramChatId: chatId,
      questionAnswers: [],
    };

    await db.insert(interviewSession).values({
      responseId: responseId,
      status: "active",
      lastChannel: channel === "TELEGRAM" ? "telegram" : "web",
      metadata: newMetadata,
    });
  }

  const session = await db.query.interviewSession.findFirst({
    where: eq(interviewSession.responseId, responseId),
  });

  if (!session) {
    throw new Error("Failed to create/update interviewSession");
  }

  // Сохраняем приветственное сообщение
  await db.insert(interviewMessage).values({
    sessionId: session.id,
    role: "assistant",
    type: "text",
    channel: channel === "TELEGRAM" ? "telegram" : "web",
    content: removeNullBytes(sentMessage),
    externalId: "",
  });

  return session;
};

/**
 * Обновляет статус отправки приветствия
 */
export const updateWelcomeSent = async (responseId: string, chatId: string) => {
  await db
    .update(response)
    .set({ welcomeSentAt: new Date() })
    .where(eq(response.id, responseId));

  await logResponseEvent({
    db,
    responseId,
    eventType: "WELCOME_SENT",
    metadata: { chatId },
  });
};