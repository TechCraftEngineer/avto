import { eq, logResponseEvent, logResponseInteraction } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  interviewSession,
  response,
} from "@qbs-autonaim/db/schema";
import { removeNullBytes } from "@qbs-autonaim/lib";
import type { CommunicationChannel } from "./types";

/**
 * Maps CommunicationChannel to InterviewChannel (for interviewSession)
 */
const mapChannel = (
  channel: CommunicationChannel,
): "web" | "telegram" | "whatsapp" | "max" => {
  switch (channel) {
    case "TELEGRAM":
      return "telegram";
    default:
      return "web"; // HH and WEB_CHAT default to web
  }
};

/**
 * Maps CommunicationChannel to InteractionChannel (for logResponseInteraction)
 */
const mapToInteractionChannel = (
  channel: CommunicationChannel,
): "telegram" | "web_chat" | "other" => {
  switch (channel) {
    case "TELEGRAM":
      return "telegram";
    case "WEB_CHAT":
      return "web_chat";
    case "HH":
    default:
      return "other"; // HH and unknown channels
  }
};

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
  const mappedChannel = mapChannel(channel);

  // Get existing session to preserve questionAnswers
  const existing = await db.query.interviewSession.findFirst({
    where: eq(interviewSession.responseId, responseId),
  });

  const existingQuestionAnswers = existing?.metadata?.questionAnswers || [];

  // Use upsert to handle concurrent calls safely
  await db
    .insert(interviewSession)
    .values({
      responseId: responseId,
      status: "active",
      lastChannel: mappedChannel,
      metadata: {
        telegramUsername: username,
        telegramChatId: chatId,
        questionAnswers: existingQuestionAnswers,
      },
    })
    .onConflictDoUpdate({
      target: interviewSession.responseId,
      set: {
        status: "active",
        lastChannel: mappedChannel,
        metadata: {
          telegramUsername: username,
          telegramChatId: chatId,
          questionAnswers: existingQuestionAnswers,
        },
      },
    });

  const session = await db.query.interviewSession.findFirst({
    where: eq(interviewSession.responseId, responseId),
  });

  if (!session) {
    throw new Error("Failed to create/update interviewSession");
  }

  // Сохраняем приветственное сообщение (idempotent)
  const externalId = `welcome:${session.id}:${mappedChannel}`;
  await db
    .insert(interviewMessage)
    .values({
      sessionId: session.id,
      role: "assistant",
      type: "text",
      channel: mappedChannel as "web" | "telegram" | "whatsapp" | "max",
      content: removeNullBytes(sentMessage),
      externalId,
    })
    .onConflictDoNothing(); // Make it idempotent

  return session;
};

/**
 * Обновляет статус отправки приветствия
 */
export const updateWelcomeSent = async (
  responseId: string,
  chatId: string,
  channel: CommunicationChannel,
) => {
  const interactionChannel = mapToInteractionChannel(channel);

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

  try {
    await logResponseInteraction({
      db,
      responseId,
      interactionType: "welcome_sent",
      source: "auto",
      channel: interactionChannel,
    });
  } catch (err) {
    console.error(
      "[updateWelcomeSent] Ошибка логирования взаимодействия:",
      { responseId, interactionType: "welcome_sent" },
      err,
    );
  }
};
