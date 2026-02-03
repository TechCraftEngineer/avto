import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramSession } from "@qbs-autonaim/db/schema";
import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import {
  generateHHInviteMessage,
  sendHHChatMessage,
} from "../../../../services/messaging";
import type {
  ResponseWithVacancy,
  SendMessageResponse,
  SendResult,
} from "./types";

/**
 * Маскирует PII данные для логирования
 */
const maskPII = (value: string): string => {
  if (!value || value.length <= 2) return "*".repeat(value.length);
  return value[0] + "*".repeat(value.length - 2) + value[value.length - 1];
};

/**
 * Отправляет сообщение в HH.ru
 */
export const sendHHWelcome = async (
  responseData: ResponseWithVacancy,
  welcomeMessage: string,
): Promise<SendResult> => {
  console.log(
    `📧 Отправка приветствия в HH.ru (источник: ${responseData.importSource})`,
  );

  if (!responseData.chatId) {
    throw new Error(
      `chatId не найден для HH отклика, невозможно отправить приветствие`,
    );
  }

  const inviteMessageResult = await generateHHInviteMessage(responseData.id);
  const messageWithInvite = inviteMessageResult.success
    ? inviteMessageResult.data
    : welcomeMessage;

  const hhResult = await sendHHChatMessage({
    workspaceId: responseData.vacancy.workspaceId,
    responseId: responseData.id,
    text: messageWithInvite,
  });

  if (!hhResult.success) {
    throw new Error(
      `Не удалось отправить приветствие в HH.ru: ${hhResult.error}`,
    );
  }

  console.log(`✅ Приветствие отправлено в HH.ru`);

  return {
    success: true,
    messageId: "",
    chatId: responseData.chatId,
    channel: "HH",
    sentMessage: messageWithInvite,
  };
};

/**
 * Отправляет сообщение в Telegram
 */
export const sendTelegramWelcome = async (
  responseData: ResponseWithVacancy,
  username: string | undefined,
  phone: string | undefined,
  message: string,
): Promise<SendResult> => {
  console.log(
    `📱 Отправка приветствия в Telegram (канал включен в настройках вакансии)`,
  );

  const workspaceId = responseData.vacancy.workspaceId;

  // Получаем активную сессию для workspace
  const session = await db.query.telegramSession.findFirst({
    where: and(
      eq(telegramSession.workspaceId, workspaceId),
      eq(telegramSession.isActive, true),
    ),
    orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
  });

  if (!session) {
    throw new Error(
      `Нет активной Telegram сессии для workspace ${workspaceId}`,
    );
  }

  let sendResult: SendMessageResponse | null = null;

  // Пытаемся отправить по username
  if (username) {
    console.log(`📨 Попытка отправки по username: @${maskPII(username)}`);
    try {
      const tgResult = await tgClientSDK.sendMessageByUsername({
        workspaceId,
        username,
        text: message,
      });

      if (tgResult) {
        console.log("✅ Приветствие отправлено по username", {
          responseId: responseData.id,
          username: maskPII(username),
          chatId: tgResult.chatId,
        });

        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, session.id));

        sendResult = tgResult;
      }
    } catch (error) {
      console.log(
        `⚠️ Не удалось отправить по username: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Если username не сработал, пробуем по телефону
  if (!sendResult && phone) {
    console.log(`📞 Попытка отправки по номеру телефона: ${maskPII(phone)}`);
    try {
      const tgResult = await tgClientSDK.sendMessageByPhone({
        workspaceId,
        phone,
        text: message,
        firstName: responseData.candidateName || undefined,
      });

      if (tgResult) {
        console.log("✅ Приветствие отправлено по номеру телефона", {
          responseId: responseData.id,
          phone: maskPII(phone),
          chatId: tgResult.chatId,
        });

        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, session.id));

        sendResult = tgResult;
      }
    } catch (error) {
      console.log(
        `⚠️ Не удалось отправить по телефону: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  if (!sendResult) {
    throw new Error(
      username && phone
        ? `Не удалось отправить приветствие ни по username (@${maskPII(username)}), ни по телефону (${maskPII(phone)})`
        : username
          ? `Не удалось отправить приветствие по username (@${maskPII(username)}), телефон не указан`
          : phone
            ? `Username не указан, не удалось отправить по телефону (${maskPII(phone)})`
            : "Не указаны ни username, ни телефон для отправки приветствия",
    );
  }

  return {
    ...sendResult,
    channel: "TELEGRAM",
    sentMessage: message,
  };
};

/**
 * Создает приглашение в веб-чат (работает независимо от Telegram)
 */
export const sendWebChatInvite = async (
  responseData: ResponseWithVacancy,
  _username: string | undefined,
  _phone: string | undefined,
  _message: string,
): Promise<SendResult> => {
  console.log(
    `🌐 Создание приглашения в веб-чат (работает независимо от Telegram)`,
  );

  const workspaceId = responseData.vacancy.workspaceId;

  // Генерируем ссылку на интервью
  const linkGenerator = new InterviewLinkGenerator();
  const interviewLink = await linkGenerator.getOrCreateInterviewLink(
    responseData.vacancy.id,
    workspaceId,
  );

  console.log("✅ Приглашение в веб-чат создано", {
    responseId: responseData.id,
    interviewUrl: interviewLink.url,
    vacancyId: responseData.vacancy.id,
  });

  // Для веб-чата достаточно создать ссылку - кандидат получит её другим способом
  return {
    success: true,
    messageId: `webchat-${responseData.id}`,
    chatId: `webchat-${responseData.id}`,
    senderId: workspaceId,
    channel: "WEB_CHAT",
    sentMessage: `Приглашение в веб-чат создано. Ссылка: ${interviewLink.url}`,
  };
};
