/**
 * Менеджер для управления несколькими ботами Telegram.
 * Поддерживает workspace-сессии (автоинтервью) и user-сессии (ручной чат).
 * Технически изолированы: разные Inngest-события, без пересечения сценариев.
 */

import type { TelegramClient } from "@mtcute/bun";
import type {
  telegramSession,
  userTelegramSession,
} from "@qbs-autonaim/db/schema";
import type { BotInstance } from "./services/bot-instance";
import { createBotInstance } from "./services/bot-instance";
import { processMissedMessages } from "./services/missed-messages-processor";
import type { UserBotInstance } from "./services/user-bot-instance";
import { createUserBotInstance } from "./services/user-bot-instance";
import { sendAuthErrorEvent } from "./utils/event-notifier";
import {
  getActiveSessions,
  getSessionByWorkspace,
  markSessionAsInvalid,
  saveSessionData,
} from "./utils/session-manager";
import {
  getActiveUserSessions,
  getSessionByUser,
  markUserSessionAsInvalid,
  saveUserSessionData,
} from "./utils/user-session-manager";

type BotInstanceUnion = BotInstance | UserBotInstance;

function isUserBotInstance(bot: BotInstanceUnion): bot is UserBotInstance {
  return "tgUserId" in bot;
}

const WORKSPACE_PREFIX = "w:";
const USER_PREFIX = "u:";

/**
 * Менеджер для управления несколькими ботами
 */
export class BotManager {
  private bots: Map<string, BotInstanceUnion> = new Map();
  private isRunning = false;

  /**
   * Запустить всех ботов из БД (workspace + user сессии)
   */
  async startAll(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Боты уже запущены");
      return;
    }

    console.log("🚀 Запуск всех Telegram ботов...");

    const [workspaceSessions, userSessions] = await Promise.all([
      getActiveSessions(),
      getActiveUserSessions(),
    ]);

    const totalSessions = workspaceSessions.length + userSessions.length;
    if (totalSessions === 0) {
      console.log("⚠️ Нет активных Telegram сессий");
      return;
    }

    console.log(
      `📋 Найдено ${workspaceSessions.length} workspace + ${userSessions.length} личных сессий`,
    );

    const workspacePromises = workspaceSessions.map((s) =>
      this.startWorkspaceBot(s),
    );
    const userPromises = userSessions.map((s) => this.startUserBot(s));
    const results = await Promise.allSettled([
      ...workspacePromises,
      ...userPromises,
    ]);

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`✅ Успешно запущено: ${successful}`);
    if (failed > 0) {
      console.log(`❌ Ошибок: ${failed}`);
    }

    this.isRunning = true;

    if (successful > 0) {
      console.log("🔍 Запуск обработки пропущенных сообщений...");
      this.processMissedMessages().catch((error) => {
        console.error("❌ Ошибка обработки пропущенных сообщений:", error);
      });
    }
  }

  /**
   * Запустить только новые сессии (не останавливая существующие)
   */
  async startNewSessions(): Promise<{ started: number; failed: number }> {
    console.log("🔍 Проверка новых Telegram сессий...");

    const [workspaceSessions, userSessions] = await Promise.all([
      getActiveSessions(),
      getActiveUserSessions(),
    ]);

    const newWorkspace = workspaceSessions.filter(
      (s) => !this.bots.has(WORKSPACE_PREFIX + s.workspaceId),
    );
    const newUser = userSessions.filter(
      (s) => !this.bots.has(USER_PREFIX + s.userId),
    );

    if (newWorkspace.length === 0 && newUser.length === 0) {
      console.log("✅ Новых сессий не найдено");
      return { started: 0, failed: 0 };
    }

    console.log(
      `🆕 Найдено ${newWorkspace.length} workspace + ${newUser.length} личных новых сессий`,
    );

    const startPromises = [
      ...newWorkspace.map((s) => this.startWorkspaceBot(s)),
      ...newUser.map((s) => this.startUserBot(s)),
    ];
    const results = await Promise.allSettled(startPromises);

    const started = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`✅ Запущено: ${started}, ❌ Ошибок: ${failed}`);

    if (started > 0) {
      console.log("🔍 Запуск обработки пропущенных сообщений...");
      this.processMissedMessages().catch((error) => {
        console.error("❌ Ошибка обработки пропущенных сообщений:", error);
      });
    }

    return { started, failed };
  }

  /**
   * Обработка ошибки авторизации workspace
   */
  private async handleWorkspaceAuthError(
    sessionId: string,
    workspaceId: string,
    phone: string,
    errorType: string,
    errorMessage: string,
  ): Promise<void> {
    console.log(
      `🔐 Auth error detected for workspace ${workspaceId}: ${errorType}`,
    );
    this.bots.delete(WORKSPACE_PREFIX + workspaceId);
    await markSessionAsInvalid(sessionId, errorType, errorMessage);
    await sendAuthErrorEvent(
      sessionId,
      workspaceId,
      errorType,
      errorMessage,
      phone,
    );
  }

  /**
   * Обработка ошибки авторизации личной сессии
   */
  private async handleUserAuthError(
    sessionId: string,
    userId: string,
    _phone: string,
    errorType: string,
    errorMessage: string,
  ): Promise<void> {
    console.log(`🔐 Auth error detected for user ${userId}: ${errorType}`);
    this.bots.delete(USER_PREFIX + userId);
    await markUserSessionAsInvalid(sessionId, errorType, errorMessage);
    // TODO: уведомление пользователю об ошибке (email?)
  }

  /**
   * Запустить workspace-бота
   */
  private async startWorkspaceBot(
    session: typeof telegramSession.$inferSelect,
  ): Promise<void> {
    const { workspaceId } = session;
    const key = WORKSPACE_PREFIX + workspaceId;

    try {
      const botInstance = await createBotInstance({
        session,
        onAuthError: this.handleWorkspaceAuthError.bind(this),
      });
      this.bots.set(key, botInstance);
    } catch (error) {
      console.error(
        `❌ Ошибка запуска бота для workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Запустить user-бота (личный Telegram)
   */
  private async startUserBot(
    session: typeof userTelegramSession.$inferSelect,
  ): Promise<void> {
    const { userId } = session;
    const key = USER_PREFIX + userId;

    try {
      const botInstance = await createUserBotInstance({
        session,
        onAuthError: this.handleUserAuthError.bind(this),
      });
      this.bots.set(key, botInstance);
    } catch (error) {
      console.error(`❌ Ошибка запуска бота для user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Остановить всех ботов
   */
  async stopAll(): Promise<void> {
    console.log("🛑 Остановка всех ботов...");

    for (const [key, bot] of this.bots.entries()) {
      if (bot.cacheSaveInterval) {
        clearInterval(bot.cacheSaveInterval);
      }

      try {
        const exportedData = await bot.storage.export();
        if (isUserBotInstance(bot)) {
          await saveUserSessionData(bot.sessionId, exportedData);
        } else {
          await saveSessionData(bot.sessionId, exportedData);
        }
        await bot.client.disconnect();
        console.log(`💾 Кэш сохранен для ${key}`);
      } catch (error) {
        console.error(`❌ Ошибка сохранения кэша для ${key}:`, error);
      }
      console.log(`✅ Бот остановлен: ${key}`);
    }

    this.bots.clear();
    this.isRunning = false;
    console.log("✅ Все боты остановлены");
  }

  /**
   * Перезапустить бота для конкретного workspace
   */
  async restartBot(workspaceId: string): Promise<void> {
    const key = WORKSPACE_PREFIX + workspaceId;
    console.log(`🔄 Перезапуск бота для workspace ${workspaceId}...`);

    const existing = this.bots.get(key);
    if (existing && !isUserBotInstance(existing)) {
      if (existing.cacheSaveInterval) clearInterval(existing.cacheSaveInterval);
      try {
        const exportedData = await existing.storage.export();
        await saveSessionData(existing.sessionId, exportedData);
      } catch (error) {
        console.error(`⚠️ Ошибка сохранения кэша:`, error);
      }
      try {
        await existing.client.disconnect();
      } catch (error) {
        console.error(`⚠️ Ошибка закрытия соединения:`, error);
      }
      this.bots.delete(key);
    }

    const session = await getSessionByWorkspace(workspaceId);
    if (!session) {
      throw new Error(
        `Telegram сессия не найдена для workspace ${workspaceId}`,
      );
    }

    await this.startWorkspaceBot(session);
    this.processMissedMessages().catch(console.error);
  }

  /**
   * Перезапустить личного бота пользователя
   */
  async restartUserBot(userId: string): Promise<void> {
    const key = USER_PREFIX + userId;
    console.log(`🔄 Перезапуск личного бота для user ${userId}...`);

    const existing = this.bots.get(key);
    if (existing && isUserBotInstance(existing)) {
      if (existing.cacheSaveInterval) clearInterval(existing.cacheSaveInterval);
      try {
        const exportedData = await existing.storage.export();
        await saveUserSessionData(existing.sessionId, exportedData);
      } catch (error) {
        console.error(`⚠️ Ошибка сохранения кэша:`, error);
      }
      try {
        await existing.client.disconnect();
      } catch (error) {
        console.error(`⚠️ Ошибка закрытия соединения:`, error);
      }
      this.bots.delete(key);
    }

    const session = await getSessionByUser(userId);
    if (!session) {
      throw new Error(`Личная Telegram сессия не найдена для user ${userId}`);
    }

    await this.startUserBot(session);
  }

  /**
   * Получить информацию о запущенных ботах
   */
  getBotsInfo(): Array<{
    type: "workspace" | "user";
    workspaceId?: string;
    userId?: string;
    sessionId: string;
    phone: string;
    username?: string;
  }> {
    return Array.from(this.bots.entries()).map(([_key, bot]) => {
      if (isUserBotInstance(bot)) {
        return {
          type: "user" as const,
          userId: bot.userId,
          sessionId: bot.sessionId,
          phone: bot.phone,
          username: bot.username,
        };
      }
      return {
        type: "workspace" as const,
        workspaceId: bot.workspaceId,
        sessionId: bot.sessionId,
        phone: bot.phone,
        username: bot.username,
      };
    });
  }

  /**
   * Получить клиента для workspace
   */
  getClient(workspaceId: string): TelegramClient | null {
    const bot = this.bots.get(WORKSPACE_PREFIX + workspaceId);
    return bot && !isUserBotInstance(bot) ? bot.client : null;
  }

  /**
   * Получить клиента для личного Telegram пользователя
   */
  getClientForUser(userId: string): TelegramClient | null {
    const bot = this.bots.get(USER_PREFIX + userId);
    return bot && isUserBotInstance(bot) ? bot.client : null;
  }

  /**
   * Проверить, запущен ли бот для workspace
   */
  isRunningForWorkspace(workspaceId: string): boolean {
    return this.bots.has(WORKSPACE_PREFIX + workspaceId);
  }

  /**
   * Проверить, запущен ли личный бот для пользователя
   */
  isRunningForUser(userId: string): boolean {
    return this.bots.has(USER_PREFIX + userId);
  }

  /**
   * Получить количество запущенных ботов
   */
  getBotsCount(): number {
    return this.bots.size;
  }

  /**
   * Обработать пропущенные сообщения для всех активных диалогов
   */
  async processMissedMessages(): Promise<void> {
    await processMissedMessages({
      getClient: this.getClient.bind(this),
    });
  }
}

// Singleton instance
export const botManager: BotManager = new BotManager();
