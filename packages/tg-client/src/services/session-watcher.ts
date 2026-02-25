import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramSession, userTelegramSession } from "@qbs-autonaim/db/schema";
import type { BotManager } from "../bot-manager";

/**
 * Сервис для отслеживания новых сессий в БД
 */
export class SessionWatcher {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private knownSessions = new Set<string>();
  private isRunning = false;
  private consecutiveErrors = 0;
  private readonly maxConsecutiveErrors = 5;

  constructor(
    private botManager: BotManager,
    private checkIntervalMs = 60000, // 60 секунд
  ) {}

  /**
   * Запустить отслеживание новых сессий
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ SessionWatcher уже запущен");
      return;
    }

    console.log("👀 Запуск отслеживания новых Telegram сессий...");

    // Загружаем текущие активные сессии
    await this.loadKnownSessions();

    this.isRunning = true;

    // Периодически проверяем новые сессии
    this.intervalId = setInterval(() => {
      this.checkNewSessions().catch((error) => {
        console.error("❌ Ошибка проверки новых сессий:", error);
      });
    }, this.checkIntervalMs);

    console.log(
      `✅ SessionWatcher запущен (интервал: ${this.checkIntervalMs}ms)`,
    );
  }

  /**
   * Остановить отслеживание
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🛑 SessionWatcher остановлен");
  }

  /**
   * Загрузить известные сессии из БД (workspace + user)
   */
  private async loadKnownSessions(): Promise<void> {
    const [workspaceSessions, userSessions] = await Promise.all([
      db
        .select({ id: telegramSession.id })
        .from(telegramSession)
        .where(eq(telegramSession.isActive, true)),
      db
        .select({ id: userTelegramSession.id })
        .from(userTelegramSession)
        .where(eq(userTelegramSession.isActive, true)),
    ]);

    this.knownSessions = new Set([
      ...workspaceSessions.map((s) => `w:${s.id}`),
      ...userSessions.map((s) => `u:${s.id}`),
    ]);
    console.log(
      `📋 Загружено ${this.knownSessions.size} известных сессий (${workspaceSessions.length} workspace + ${userSessions.length} user)`,
    );
  }

  /**
   * Проверить наличие новых сессий
   */
  private async checkNewSessions(): Promise<void> {
    try {
      const [workspaceSessions, userSessions] = await Promise.all([
        db
          .select()
          .from(telegramSession)
          .where(eq(telegramSession.isActive, true)),
        db
          .select()
          .from(userTelegramSession)
          .where(eq(userTelegramSession.isActive, true)),
      ]);

      this.consecutiveErrors = 0;

      const newWorkspace = workspaceSessions.filter(
        (s) => !this.knownSessions.has(`w:${s.id}`),
      );
      const newUser = userSessions.filter(
        (s) => !this.knownSessions.has(`u:${s.id}`),
      );

      if (newWorkspace.length === 0 && newUser.length === 0) {
        return;
      }

      console.log(
        `🆕 Обнаружено ${newWorkspace.length} workspace + ${newUser.length} user новых сессий`,
      );

      for (const session of newWorkspace) {
        try {
          if (this.botManager.isRunningForWorkspace(session.workspaceId)) {
            this.knownSessions.add(`w:${session.id}`);
            continue;
          }
          console.log(
            `🚀 Запуск новой сессии для workspace ${session.workspaceId}...`,
          );
          await this.botManager.restartBot(session.workspaceId);
          this.knownSessions.add(`w:${session.id}`);
        } catch (error) {
          console.error(
            `❌ Ошибка запуска workspace сессии ${session.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      for (const session of newUser) {
        try {
          if (this.botManager.isRunningForUser(session.userId)) {
            this.knownSessions.add(`u:${session.id}`);
            continue;
          }
          console.log(
            `🚀 Запуск новой личной сессии для user ${session.userId}...`,
          );
          await this.botManager.restartUserBot(session.userId);
          this.knownSessions.add(`u:${session.id}`);
        } catch (error) {
          console.error(
            `❌ Ошибка запуска user сессии ${session.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    } catch (error) {
      this.consecutiveErrors++;
      console.error(
        `❌ Ошибка запроса к БД (попытка ${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`,
        error instanceof Error ? error.message : error,
      );

      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error(
          `🛑 Достигнут лимит ошибок (${this.maxConsecutiveErrors}), остановка SessionWatcher`,
        );
        this.stop();
      }
    }
  }

  /**
   * Получить статус watcher'а
   */
  getStatus(): {
    isRunning: boolean;
    knownSessionsCount: number;
    checkIntervalMs: number;
  } {
    return {
      isRunning: this.isRunning,
      knownSessionsCount: this.knownSessions.size,
      checkIntervalMs: this.checkIntervalMs,
    };
  }
}
