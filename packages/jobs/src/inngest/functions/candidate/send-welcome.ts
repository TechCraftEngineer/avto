import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  interviewSession,
  response,
  telegramSession,
} from "@qbs-autonaim/db/schema";
import { logResponseEvent, removeNullBytes } from "@qbs-autonaim/lib";
import { InterviewLinkGenerator } from "@qbs-autonaim/shared";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import {
  generateTelegramInviteMessage,
  generateWelcomeMessage,
  sendHHChatMessage,
} from "../../../services/messaging";
import { inngest } from "../../client";

/**
 * Типы каналов общения
 */
type CommunicationChannel = "HH" | "TELEGRAM" | "WEB_CHAT";

/**
 * Результат отправки сообщения
 */
interface SendResult {
  success: boolean;
  messageId: string;
  chatId: string;
  senderId?: string;
  channel: CommunicationChannel;
  sentMessage: string;
}

/**
 * Получает данные отклика и связанной вакансии
 */
const fetchResponseData = async (responseId: string) => {
  const result = await db.query.response.findFirst({
    where: eq(response.id, responseId),
  });

  if (!result) {
    throw new Error(`Отклик не найден: ${responseId}`);
  }

  const vacancy = await db.query.vacancy.findFirst({
    where: (v, { eq }) => eq(v.id, result.entityId),
  });

  if (!vacancy) {
    throw new Error(`Вакансия не найдена для отклика: ${responseId}`);
  }

  return { ...result, vacancy };
};

/**
 * Отправляет сообщение в HH.ru
 */
const sendHHWelcome = async (
  responseData: any,
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
const sendTelegramWelcome = async (
  responseData: any,
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

  let sendResult: any = null;

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
const sendWebChatInvite = async (
  responseData: any,
  username: string | undefined,
  phone: string | undefined,
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

  // Создаем сообщение с приглашением
  const webChatInviteMessage = [
    "Здравствуйте!",
    "",
    `Спасибо за отклик на вакансию "${responseData.vacancy.title}".`,
    "",
    "Для продолжения пройдите интервью с AI-ассистентом:",
    interviewLink.url,
    "",
    "Интервью займет 5-10 минут.",
  ].join("\n");

  let sendResult: any = null;

  // Пытаемся отправить по username
  if (username) {
    console.log(`📨 Попытка отправки приглашения по username: @${username}`);
    try {
      const tgResult = await tgClientSDK.sendMessageByUsername({
        workspaceId,
        username,
        text: webChatInviteMessage,
      });

      if (tgResult) {
        console.log("✅ Приглашение в веб-чат отправлено по username", {
          responseId: responseData.id,
          username,
          chatId: tgResult.chatId,
          interviewUrl: interviewLink.url,
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
        text: webChatInviteMessage,
        firstName: responseData.candidateName || undefined,
      });

      if (tgResult) {
        console.log("✅ Приглашение в веб-чат отправлено по номеру телефона", {
          responseId: responseData.id,
          phone,
          chatId: tgResult.chatId,
          interviewUrl: interviewLink.url,
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
    sentMessage: webChatInviteMessage,
  };
};

/**
 * Сохраняет или обновляет interviewSession
 */
const saveInterviewSession = async (
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
const updateWelcomeSent = async (responseId: string, chatId: string) => {
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

/**
 * Inngest функция для отправки приветственного сообщения кандидату
 * Маршрутизирует отправку по настройкам каналов общения вакансии:
 * - HH: отправляет в HH.ru (независимо от настроек)
 * - telegram: true в настройках - отправляет приветствие в Telegram
 * - webChat: true в настройках - отправляет приглашение с ссылкой на веб-интервью в Telegram
 * - Нет включенных каналов: пропускает отправку
 */
export const sendCandidateWelcomeFunction = inngest.createFunction(
  {
    id: "send-candidate-welcome",
    name: "Send Candidate Welcome Message",
    retries: 3,
  },
  { event: "candidate/welcome" },
  async ({ event, step }) => {
    const { responseId, username, phone } = event.data;

    // Получаем данные отклика
    const responseData = await step.run("fetch-response-data", async () => {
      return fetchResponseData(responseId);
    });

    // Получаем настройки каналов общения из вакансии
    const enabledChannels = responseData.vacancy.enabledCommunicationChannels || {
      webChat: true,
      telegram: false,
    };

    let sendResult: SendResult | null = null;

    if (responseData.importSource === "HH") {
      // Отправляем только в HH.ru
      const welcomeMessage = await step.run("generate-welcome-message", async () => {
        console.log("🤖 Генерация приветственного сообщения для HH", {
          responseId,
          username,
        });

        const result = await generateWelcomeMessage(responseId, "hh");

        if (!result.success) {
          throw new Error(result.error);
        }

        console.log("✅ Сообщение сгенерировано", {
          responseId,
          messageLength: result.data.length,
        });

        return result.data;
      });

      sendResult = await step.run("send-hh-welcome", async () => {
        return sendHHWelcome(responseData, welcomeMessage);
      });
    } else if (enabledChannels.telegram) {
      // Проверяем наличие Telegram сессии перед отправкой приветствия
      const hasTelegramSession = await step.run("check-telegram-session", async () => {
        const session = await db.query.telegramSession.findFirst({
          where: eq(telegramSession.workspaceId, responseData.vacancy.workspaceId),
          orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
        });
        return !!session;
      });

      if (hasTelegramSession) {
        // Отправляем приветствие в Telegram
        const welcomeMessage = await step.run("generate-welcome-message", async () => {
          console.log("🤖 Генерация приветственного сообщения для Telegram", {
            responseId,
            username,
          });

          const result = await generateWelcomeMessage(responseId, "telegram");

          if (!result.success) {
            throw new Error(result.error);
          }

          console.log("✅ Сообщение сгенерировано", {
            responseId,
            messageLength: result.data.length,
          });

          return result.data;
        });

        sendResult = await step.run("send-telegram-welcome", async () => {
          return sendTelegramWelcome(responseData, username, phone, welcomeMessage);
        });
      } else {
        // Нет Telegram сессии, пропускаем отправку
        console.log(`⚠️ Пропускаем отправку приветствия в Telegram для workspace ${responseData.vacancy.workspaceId} - нет активной Telegram сессии`);
        return { success: false, error: "No Telegram session available for telegram channel" };
      }
    } else if (enabledChannels.webChat) {
      // Проверяем наличие Telegram сессии перед отправкой приглашения в веб-чат
      const hasTelegramSession = await step.run("check-telegram-session", async () => {
        const session = await db.query.telegramSession.findFirst({
          where: eq(telegramSession.workspaceId, responseData.vacancy.workspaceId),
          orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
        });
        return !!session;
      });

      if (hasTelegramSession) {
        // Отправляем приглашение в веб-чат через Telegram
        sendResult = await step.run("send-webchat-invite", async () => {
          return sendWebChatInvite(responseData, username, phone);
        });
      } else {
        // Нет Telegram сессии, пропускаем отправку
        console.log(`⚠️ Пропускаем отправку приглашения в веб-чат для workspace ${responseData.vacancy.workspaceId} - нет активной Telegram сессии`);
        return { success: false, error: "No Telegram session available for webChat" };
      }
    } else {
      // Нет включенных каналов общения
      console.log(`📋 Нет включенных каналов общения для вакансии ${responseData.vacancy.id}`);
      return { success: false, error: "No communication channels enabled" };
    }

    // Если получили chatId, сохраняем/обновляем interviewSession
    if (sendResult?.chatId) {
      await step.run("save-interview-session", async () => {
        return saveInterviewSession(
          responseId,
          sendResult.chatId,
          sendResult.channel,
          sendResult.sentMessage,
          username,
        );
      });

      // Обновляем welcomeSentAt только после успешной отправки
      await step.run("update-welcome-sent", async () => {
        return updateWelcomeSent(responseId, sendResult.chatId);
      });

      return {
        success: true,
        chatId: sendResult.chatId,
        messageId: sendResult.messageId,
      };
    }

    return { success: false, error: "No chatId received" };
  }
);
