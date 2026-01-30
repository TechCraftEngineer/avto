import type { DbClient, VacancyDraft } from "@qbs-autonaim/db";
import { DraftRepository } from "@qbs-autonaim/db";
import type { CreateDraftInput, UpdateDraftInput } from "@qbs-autonaim/shared";
import type { ErrorHandler } from "../utils/error-handler";
import { ErrorCategory, ErrorSeverity } from "../utils/error-handler";

/**
 * Сервис бизнес-логики для работы с черновиками вакансий
 * Обеспечивает автоматическое сохранение прогресса создания вакансии через AI-бота
 *
 * Требования: 1.4, 1.5, 2.5, 3.3, 5.3, 7.1, 7.2, 7.3, 7.4
 */
export class DraftService {
  private readonly EXPIRATION_DAYS = 7;
  private readonly MAX_RETRIES = 3;

  constructor(
    private db: DbClient,
    private errorHandler?: ErrorHandler,
  ) {}

  /**
   * Получить текущий черновик пользователя
   * Автоматически удаляет устаревшие черновики (старше 7 дней)
   *
   * @param userId - ID пользователя
   * @returns Черновик или null, если не найден или устарел
   *
   * Требование 2.5: Автоматическое удаление устаревших черновиков
   * Требование 7.3: Обработка поврежденных черновиков
   */
  async getCurrentDraft(userId: string): Promise<VacancyDraft | null> {
    try {
      const repo = new DraftRepository(this.db);
      const draft = await repo.findByUserId(userId);

      if (!draft) {
        return null;
      }

      // Удалить черновик, если он старше 7 дней
      if (this.isExpired(draft)) {
        await repo.delete(draft.id);
        return null;
      }

      // Проверить валидность структуры черновика
      if (!this.isValidDraft(draft)) {
        // Логировать поврежденный черновик
        if (this.errorHandler) {
          await this.errorHandler.handleError({
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            message: `Поврежденный черновик обнаружен для пользователя ${userId}`,
            userMessage:
              "Не удалось загрузить черновик. Начните создание заново",
            context: { userId, draftId: draft.id },
          });
        }
        // Удалить поврежденный черновик
        await repo.delete(draft.id);
        return null;
      }

      return draft;
    } catch (error) {
      // Обработка ошибок БД
      if (this.errorHandler) {
        await this.errorHandler.handleDatabaseError(error as Error, {
          operation: "getCurrentDraft",
          userId,
        });
      }
      throw error;
    }
  }

  /**
   * Создать новый черновик
   * Удаляет существующий черновик пользователя перед созданием нового
   *
   * @param userId - ID пользователя
   * @param input - Данные для создания черновика
   * @returns Созданный черновик
   *
   * Требование 3.3: Только один активный черновик на пользователя
   * Требование 7.1, 7.4: Обработка ошибок с понятными сообщениями
   */
  async createDraft(
    userId: string,
    input: CreateDraftInput,
  ): Promise<VacancyDraft> {
    try {
      const repo = new DraftRepository(this.db);

      // Удалить существующий черновик перед созданием нового
      const existing = await repo.findByUserId(userId);
      if (existing) {
        await repo.delete(existing.id);
      }

      return await repo.create({
        userId,
        ...input,
      });
    } catch (error) {
      // Обработка ошибок БД
      if (this.errorHandler) {
        await this.errorHandler.handleDatabaseError(error as Error, {
          operation: "createDraft",
          userId,
        });
      }
      throw error;
    }
  }

  /**
   * Обновить существующий черновик
   * Использует retry логику с экспоненциальной задержкой (3 попытки)
   *
   * @param userId - ID пользователя
   * @param input - Данные для обновления
   * @returns Обновленный черновик
   * @throws Error если черновик не найден или все попытки неуспешны
   *
   * Требование 1.4, 1.5: Retry логика при ошибках сохранения
   * Требование 7.1: Понятные сообщения об ошибках
   */
  async updateDraft(
    userId: string,
    input: UpdateDraftInput,
  ): Promise<VacancyDraft> {
    try {
      const repo = new DraftRepository(this.db);
      const draft = await repo.findByUserId(userId);

      if (!draft) {
        if (this.errorHandler) {
          await this.errorHandler.handleNotFoundError("Черновик", { userId });
        }
        throw new Error("Черновик не найден");
      }

      // Выполнить обновление с retry логикой
      return await this.retryOperation(() => repo.update(draft.id, input));
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Если это ошибка "не найден", не обрабатываем повторно
      if (errorMessage === "Черновик не найден") {
        throw error;
      }

      // Обработка ошибок сети/БД
      if (this.errorHandler) {
        await this.errorHandler.handleError({
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.HIGH,
          message: `Не удалось обновить черновик после ${this.MAX_RETRIES} попыток: ${errorMessage}`,
          userMessage:
            "Не удалось сохранить изменения. Проверьте подключение к интернету",
          context: { userId, retries: this.MAX_RETRIES },
          originalError: error as Error,
        });
      }
      throw error;
    }
  }

  /**
   * Удалить черновик пользователя
   *
   * @param userId - ID пользователя
   *
   * Требование 5.3: Очистка черновика после создания вакансии
   */
  async deleteDraft(userId: string): Promise<void> {
    try {
      const repo = new DraftRepository(this.db);
      const draft = await repo.findByUserId(userId);

      if (draft) {
        await repo.delete(draft.id);
      }
    } catch (error) {
      if (this.errorHandler) {
        await this.errorHandler.handleError({
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.MEDIUM,
          message: `Ошибка при удалении черновика: ${(error as Error).message}`,
          userMessage: "Не удалось удалить черновик",
          context: { userId },
          originalError: error as Error,
        });
      }
      throw error;
    }
  }

  /**
   * Проверить, устарел ли черновик (старше 7 дней)
   *
   * @param draft - Черновик для проверки
   * @returns true если черновик устарел
   *
   * Требование 2.5: Проверка устаревших черновиков
   */
  private isExpired(draft: VacancyDraft): boolean {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - this.EXPIRATION_DAYS);
    return draft.updatedAt < expirationDate;
  }

  /**
   * Выполнить операцию с retry логикой и экспоненциальной задержкой
   *
   * @param operation - Операция для выполнения
   * @returns Результат операции
   * @throws Последняя ошибка, если все попытки неуспешны
   *
   * Требование 1.4: Retry логика с экспоненциальной задержкой (3 попытки)
   */
  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.MAX_RETRIES - 1) {
          // Экспоненциальная задержка: 100ms, 200ms, 400ms
          await this.delay(2 ** attempt * 100);
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error("Не удалось выполнить операцию после всех попыток");
  }

  /**
   * Задержка выполнения
   *
   * @param ms - Миллисекунды задержки
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Проверить валидность структуры черновика
   *
   * @param draft - Черновик для проверки
   * @returns true если черновик валиден
   *
   * Требование 7.3: Обработка поврежденных черновиков
   */
  private isValidDraft(draft: VacancyDraft): boolean {
    try {
      // Проверка обязательных полей
      if (!draft.id || !draft.userId || !draft.draftData) {
        return false;
      }

      const data = draft.draftData as {
        conversationHistory?: unknown;
        vacancyData?: unknown;
        currentStep?: unknown;
      };

      // Проверка структуры draftData
      if (
        !data.conversationHistory ||
        !Array.isArray(data.conversationHistory)
      ) {
        return false;
      }

      if (!data.vacancyData || typeof data.vacancyData !== "object") {
        return false;
      }

      if (!data.currentStep || typeof data.currentStep !== "string") {
        return false;
      }

      // Проверка структуры сообщений в истории
      for (const msg of data.conversationHistory) {
        if (
          !msg ||
          typeof msg !== "object" ||
          !("role" in msg) ||
          !("content" in msg) ||
          !("timestamp" in msg)
        ) {
          return false;
        }

        const message = msg as {
          role: unknown;
          content: unknown;
          timestamp: unknown;
        };

        if (
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.content !== "string" ||
          typeof message.timestamp !== "string"
        ) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}
