import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramSession } from "@qbs-autonaim/db/schema";
import { InterviewLinkGenerator } from "@qbs-autonaim/shared";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import {
  generateTelegramInviteMessage,
  sendHHChatMessage,
} from "../../../../services/messaging";
import type { CommunicationChannel, ResponseWithVacancy, SendMessageResponse, SendResult } from "./types";

/**
 * Отправляет сообщение в HH.ru
 */
export const sendHHWelcome = async (
  responseData: ResponseWithVacancy,
  welcomeMessage: string,
): Promise<SendResult> => {
  console.log(`📧 Отправка приветствия в HH.ru (источник: ${responseData.importSource})`);

  if (!responseData.chatId) {
    throw new Error(`chatId не найден для HH отклика, невозможно отправить приветствие`);
  }

  const inviteMessageResult = await generateTelegramInviteMessage(responseData.id);
  const messageWithInvite = inviteMessageResult.success
    ? inviteMessageResult.data
    : welcomeMessage;

  const hhResult = await sendHHChatMessage({
    workspaceId: responseData.vacancy.workspaceId,
    responseId: responseData.id,
    text: messageWithInvite,
  });

  if (!hhResult.success) {
    throw new Error(`Не удалось отправить приветствие в HH.ru: ${hhResult.error}`);
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
  console.log(`📱 Отправка приветствия в Telegram (канал включен в настройках вакансии)`);

  const workspaceId = responseData.vacancy.workspaceId;

  // Получаем активную сессию для workspace
  const session = await db.query.telegramSession.findFirst({
    where: eq(telegramSession.workspaceId, workspaceId),
    orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
  });

  if (!session) {
    throw new Error(`Нет активной Telegram сессии для workspace ${workspaceId}`);
  }

  let sendResult: SendMessageResponse | null = null;

  // Пытаемся отправить по username
  if (username) {
    console.log(`📨 Попытка отправки по username: @${username}`);
    try {
      const tgResult = await tgClientSDK.sendMessageByUsername({
        workspaceId,
        username,
        text: message,
      });

      if (tgResult) {
        console.log("✅ Приветствие отправлено по username", {
          responseId: responseData.id,
          username,
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
    console.log(`📞 Попытка отправки по номеру телефона: ${phone}`);
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
          phone,
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
        ? `Не удалось отправить приветствие ни по username (@${username}), ни по телефону (${phone})`
        : username
          ? `Не удалось отправить приветствие по username (@${username}), телефон не указан`
          : phone
            ? `Username не указан, не удалось отправить по телефону (${phone})`
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
 * Отправляет приглашение в веб-чат через Telegram
 */
export const sendWebChatInvite = async (
  responseData: ResponseWithVacancy,
  username: string | undefined,
  phone: string | undefined,
  message: string,
): Promise<SendResult> => {
  console.log(`🌐 Отправка приглашения в веб-чат через Telegram (канал включен в настройках вакансии)`);

  const workspaceId = responseData.vacancy.workspaceId;

  // Получаем активную сессию для workspace
  const session = await db.query.telegramSession.findFirst({
    where: eq(telegramSession.workspaceId, workspaceId),
    orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
  });

  if (!session) {
    console.log(`⚠️ Нет активной Telegram сессии для workspace ${workspaceId}, пропускаем отправку приглашения в веб-чат`);
    throw new Error(`Нет активной Telegram сессии для workspace ${workspaceId}`);
  }

  // Генерируем ссылку на интервью
  const linkGenerator = new InterviewLinkGenerator();
  const interviewLink = await linkGenerator.getOrCreateInterviewLink(
    responseData.vacancy.id,
    workspaceId,
  );

  // Добавляем ссылку на интервью в конец сообщения, если её там нет
  let finalMessage = message;
  if (!finalMessage.includes(interviewLink.url)) {
    finalMessage += `\n\nДля продолжения пройдите интервью с AI-ассистентом:\n${interviewLink.url}`;
  }

  let sendResult: SendMessageResponse | null = null;

  // Пытаемся отправить по username
  if (username) {
    console.log(`📨 Попытка отправки приглашения по username: @${username}`);
    try {
      const tgResult = await tgClientSDK.sendMessageByUsername({
        workspaceId,
        username,
        text: finalMessage,
      });

      if (tgResult) {
        console.log("✅ Приглашение в веб-чат отправлено по username", {
          responseId: responseData.id,
          username,
          chatId: tgResult.chatId,
          interviewUrl: interviewLink.url,
          messageLength: finalMessage.length,
        });

        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, session.id));

        sendResult = tgResult;
      }
    } catch (error) {
      console.log(
        `⚠️ Не удалось отправить приглашение по username: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Если username не сработал, пробуем по телефону
  if (!sendResult && phone) {
    console.log(`📞 Попытка отправки приглашения по номеру телефона: ${phone}`);
    try {
      const tgResult = await tgClientSDK.sendMessageByPhone({
        workspaceId,
        phone,
        text: finalMessage,
        firstName: responseData.candidateName || undefined,
      });

      if (tgResult) {
        console.log("✅ Приглашение в веб-чат отправлено по номеру телефона", {
          responseId: responseData.id,
          phone,
          chatId: tgResult.chatId,
          interviewUrl: interviewLink.url,
          messageLength: finalMessage.length,
        });

        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, session.id));

        sendResult = tgResult;
      }
    } catch (error) {
      console.log(
        `⚠️ Не удалось отправить приглашение по телефону: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  if (!sendResult) {
    throw new Error(
      username && phone
        ? `Не удалось отправить приглашение в веб-чат ни по username (@${username}), ни по телефону (${phone})`
        : username
          ? `Не удалось отправить приглашение в веб-чат по username (@${username}), телефон не указан`
          : phone
            ? `Username не указан, не удалось отправить приглашение по телефону (${phone})`
            : "Не указаны ни username, ни телефон для отправки приглашения в веб-чат",
    );
  }

  return {
    ...sendResult,
    channel: "WEB_CHAT",
    sentMessage: finalMessage,
  };
};