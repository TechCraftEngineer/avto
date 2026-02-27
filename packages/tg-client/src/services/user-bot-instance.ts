/**
 * Управление экземпляром бота для личного Telegram пользователя.
 * Изолировано от workspace-ботов: только логирование сообщений, без AI-интервью.
 */

import { TelegramClient } from "@mtcute/bun";
import { Dispatcher } from "@mtcute/dispatcher";
import type { userTelegramSession } from "@qbs-autonaim/db/schema";
import {
  decryptApiKeys,
  getEncryptionKey,
  isEncrypted,
} from "@qbs-autonaim/server-utils";
import type { MessageData } from "../schemas/message-data.schema";
import { messageDataSchema } from "../schemas/message-data.schema";
import { ExportableStorage } from "../storage";
import { isAuthError } from "../utils/auth-errors";
import { triggerPersonalIncomingMessage } from "../utils/inngest";
import { markRead } from "../utils/telegram";
import { saveUserSessionData } from "../utils/user-session-manager";

export interface UserBotInstance {
  client: TelegramClient;
  userId: string;
  sessionId: string;
  tgUserId: string;
  username?: string;
  phone: string;
  storage: ExportableStorage;
  cacheSaveInterval?: ReturnType<typeof setInterval>;
}

export interface UserBotInstanceConfig {
  session: typeof userTelegramSession.$inferSelect;
  onAuthError: (
    sessionId: string,
    userId: string,
    phone: string,
    errorType: string,
    errorMessage: string,
  ) => Promise<void>;
}

/**
 * Создает и запускает экземпляр бота для личного Telegram
 */
export async function createUserBotInstance(
  config: UserBotInstanceConfig,
): Promise<UserBotInstance> {
  const { session, onAuthError } = config;
  let { id: sessionId, userId, apiId, apiHash, sessionData, phone } = session;

  if (apiId && apiHash && isEncrypted(apiId)) {
    const encryptionKey = getEncryptionKey();
    const decrypted = await decryptApiKeys({ apiId, apiHash }, encryptionKey);
    apiId = decrypted.apiId;
    apiHash = decrypted.apiHash;
  }

  if (!apiId || !apiHash) {
    throw new Error(`Отсутствуют apiId или apiHash для user ${userId}`);
  }

  const parsedApiId = Number.parseInt(apiId, 10);
  if (Number.isNaN(parsedApiId)) {
    throw new Error(
      `Некорректное значение apiId для user ${userId}: "${apiId}" не является числом`,
    );
  }

  const storage = new ExportableStorage();
  if (sessionData) {
    await storage.import(sessionData as Record<string, string>);
  }

  const client = new TelegramClient({
    apiId: parsedApiId,
    apiHash,
    storage,
    updates: {
      catchUp: true,
      messageGroupingInterval: 250,
    },
    logLevel: 1,
  });

  console.log(`🔌 Подключение личного клиента для user ${userId}...`);

  let tgUser: Awaited<ReturnType<typeof client.getMe>> | null = null;
  try {
    tgUser = await client.getMe();
  } catch (error) {
    const authCheck = isAuthError(error);
    if (authCheck.isAuth) {
      await onAuthError(
        sessionId,
        userId,
        phone,
        authCheck.errorType || "AUTH_ERROR",
        authCheck.errorMessage || "Неизвестная ошибка аутентификации",
      );
      throw new Error(
        `Сессия не авторизована для user ${userId}: ${authCheck.errorType}`,
      );
    }
    throw error;
  }

  if (!tgUser) {
    throw new Error(
      `Не удалось получить информацию о пользователе для user ${userId}`,
    );
  }

  const dp = Dispatcher.for(client);

  dp.onNewMessage(async (msg) => {
    try {
      if (msg.isOutgoing) return;

      await markRead(client, msg.chat.id);

      const messageDataRaw: MessageData = {
        id: msg.id,
        chatId: msg.chat.id.toString(),
        text: msg.text,
        isOutgoing: msg.isOutgoing,
        media: msg.media
          ? {
              type: msg.media.type,
              fileId:
                "fileId" in msg.media && typeof msg.media.fileId === "string"
                  ? msg.media.fileId
                  : undefined,
              mimeType:
                "mimeType" in msg.media &&
                typeof msg.media.mimeType === "string"
                  ? msg.media.mimeType
                  : undefined,
              duration:
                "duration" in msg.media &&
                typeof msg.media.duration === "number"
                  ? msg.media.duration
                  : undefined,
            }
          : undefined,
        sender: msg.sender
          ? {
              type: msg.sender.type,
              username:
                "username" in msg.sender &&
                typeof msg.sender.username === "string"
                  ? msg.sender.username
                  : undefined,
              firstName:
                msg.sender.type === "user" &&
                "firstName" in msg.sender &&
                typeof msg.sender.firstName === "string"
                  ? msg.sender.firstName
                  : undefined,
            }
          : undefined,
      };

      const validationResult = messageDataSchema.safeParse(messageDataRaw);
      if (!validationResult.success) {
        console.error(
          "❌ Ошибка валидации данных сообщения (personal):",
          validationResult.error.format(),
        );
        return;
      }

      await triggerPersonalIncomingMessage(userId, validationResult.data);
    } catch (error) {
      const authCheck = isAuthError(error);
      if (authCheck.isAuth) {
        await onAuthError(
          sessionId,
          userId,
          phone,
          authCheck.errorType || "AUTH_ERROR",
          authCheck.errorMessage || "Неизвестная ошибка аутентификации",
        );
        return;
      }
      console.error(
        `❌ [user:${userId}] Ошибка триггера сообщения ${msg.id}:`,
        error,
      );
    }
  });

  dp.onError(async (err, _upd) => {
    const authCheck = isAuthError(err);
    if (authCheck.isAuth) {
      await onAuthError(
        sessionId,
        userId,
        phone,
        authCheck.errorType || "AUTH_ERROR",
        authCheck.errorMessage || "Неизвестная ошибка аутентификации",
      );
      return true;
    }
    console.error(`❌ [user:${userId}] Ошибка в dispatcher:`, err);
    return false;
  });

  await client.start();

  console.log(
    `✅ Личный бот запущен для user ${userId}: ${tgUser.firstName || ""} (@${tgUser.username || "no username"}) [${phone}]`,
  );

  const cacheSaveInterval = setInterval(
    async () => {
      try {
        const exportedData = await storage.export();
        await saveUserSessionData(sessionId, exportedData);
      } catch (error) {
        console.error(`❌ [user:${userId}] Ошибка сохранения кэша:`, error);
      }
    },
    5 * 60 * 1000,
  );

  return {
    client,
    userId,
    sessionId,
    tgUserId: tgUser.id.toString(),
    username: tgUser.username || undefined,
    phone,
    storage,
    cacheSaveInterval,
  };
}
