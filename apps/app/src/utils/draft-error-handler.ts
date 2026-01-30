/**
 * Утилита для обработки ошибок черновиков на клиенте
 * Обеспечивает graceful degradation при недоступности сервера
 *
 * Требования: 1.5, 7.1, 7.2, 7.3, 7.4
 */

/**
 * Типы ошибок черновиков
 */
export enum DraftErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHORIZATION = "AUTHORIZATION",
  DATABASE = "DATABASE",
  CORRUPTED = "CORRUPTED",
  UNKNOWN = "UNKNOWN",
}

/**
 * Информация об ошибке черновика
 */
export interface DraftErrorInfo {
  type: DraftErrorType;
  message: string;
  retryable: boolean;
  action?: "redirect_to_login" | "start_new" | "retry";
}

/**
 * Класс для обработки ошибок черновиков на клиенте
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DraftErrorHandler {
  /**
   * Обработать ошибку и вернуть информацию для UI
   *
   * @param error - Ошибка для обработки
   * @returns Информация об ошибке для отображения пользователю
   */
  static handle(error: unknown): DraftErrorInfo {
    // Логирование ошибки
    console.error("Ошибка черновика:", error);

    // Обработка tRPC ошибок
    if (DraftErrorHandler.isTRPCError(error)) {
      return DraftErrorHandler.handleTRPCError(error);
    }

    // Обработка сетевых ошибок
    if (DraftErrorHandler.isNetworkError(error)) {
      return {
        type: DraftErrorType.NETWORK,
        message:
          "Не удалось сохранить изменения. Проверьте подключение к интернету",
        retryable: true,
        action: "retry",
      };
    }

    // Общая ошибка
    return {
      type: DraftErrorType.UNKNOWN,
      message: "Произошла непредвиденная ошибка",
      retryable: false,
    };
  }

  /**
   * Проверить, является ли ошибка tRPC ошибкой
   */
  private static isTRPCError(error: unknown): error is {
    data?: { code?: string };
    message?: string;
  } {
    return (
      typeof error === "object" &&
      error !== null &&
      "data" in error &&
      typeof (error as { data?: unknown }).data === "object"
    );
  }

  /**
   * Обработать tRPC ошибку
   */
  private static handleTRPCError(error: {
    data?: { code?: string };
    message?: string;
  }): DraftErrorInfo {
    const code = error.data?.code;
    const message = error.message ?? "Произошла ошибка";

    switch (code) {
      case "UNAUTHORIZED":
        return {
          type: DraftErrorType.AUTHORIZATION,
          message: "Необходимо войти в систему",
          retryable: false,
          action: "redirect_to_login",
        };

      case "FORBIDDEN":
        return {
          type: DraftErrorType.AUTHORIZATION,
          message: "Нет доступа к черновику",
          retryable: false,
        };

      case "NOT_FOUND":
        return {
          type: DraftErrorType.CORRUPTED,
          message: "Не удалось загрузить черновик. Начните создание заново",
          retryable: false,
          action: "start_new",
        };

      case "BAD_REQUEST":
        return {
          type: DraftErrorType.VALIDATION,
          message: message || "Некорректные данные черновика",
          retryable: false,
        };

      case "INTERNAL_SERVER_ERROR":
        // Проверяем, является ли это ошибкой БД
        if (message.includes("база данных") || message.includes("database")) {
          return {
            type: DraftErrorType.DATABASE,
            message:
              "Временные проблемы с сервером. Попробуйте повторить позже",
            retryable: true,
            action: "retry",
          };
        }

        return {
          type: DraftErrorType.UNKNOWN,
          message: "Произошла ошибка на сервере",
          retryable: true,
          action: "retry",
        };

      default:
        return {
          type: DraftErrorType.UNKNOWN,
          message: message || "Произошла непредвиденная ошибка",
          retryable: false,
        };
    }
  }

  /**
   * Проверить, является ли ошибка сетевой ошибкой
   */
  private static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("timeout") ||
        message.includes("connection")
      );
    }
    return false;
  }

  /**
   * Получить сообщение об ошибке для отображения пользователю
   *
   * @param errorType - Тип ошибки
   * @returns Понятное сообщение на русском языке
   */
  static getUserMessage(errorType: DraftErrorType): string {
    switch (errorType) {
      case DraftErrorType.NETWORK:
        return "Не удалось сохранить изменения. Проверьте подключение к интернету";

      case DraftErrorType.VALIDATION:
        return "Произошла ошибка при сохранении данных";

      case DraftErrorType.AUTHORIZATION:
        return "Доступ запрещен";

      case DraftErrorType.DATABASE:
        return "Временные проблемы с сервером. Попробуйте повторить позже";

      case DraftErrorType.CORRUPTED:
        return "Не удалось загрузить черновик. Начните создание заново";

      case DraftErrorType.UNKNOWN:
      default:
        return "Произошла непредвиденная ошибка";
    }
  }
}

/**
 * Хранилище для локального резервного копирования черновиков
 * Используется при недоступности сервера (graceful degradation)
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LocalDraftStorage {
  private static readonly STORAGE_KEY = "draft_backup";

  /**
   * Сохранить черновик в localStorage
   *
   * @param userId - ID пользователя
   * @param data - Данные черновика
   */
  static save(
    userId: string,
    data: {
      conversationHistory: Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: Date;
      }>;
      vacancyData: {
        title?: string;
        description?: string;
        requirements?: string[];
        conditions?: string[];
        salary?: {
          min?: number;
          max?: number;
          currency?: string;
        };
      };
      currentStep: string;
    },
  ): void {
    try {
      const backup = {
        userId,
        data: {
          ...data,
          conversationHistory: data.conversationHistory.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
        },
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        LocalDraftStorage.STORAGE_KEY,
        JSON.stringify(backup),
      );
    } catch (error) {
      console.error("Не удалось сохранить резервную копию черновика:", error);
    }
  }

  /**
   * Загрузить черновик из localStorage
   *
   * @param userId - ID пользователя
   * @returns Данные черновика или null
   */
  static load(userId: string): {
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>;
    vacancyData: {
      title?: string;
      description?: string;
      requirements?: string[];
      conditions?: string[];
      salary?: {
        min?: number;
        max?: number;
        currency?: string;
      };
    };
    currentStep: string;
  } | null {
    try {
      const stored = localStorage.getItem(LocalDraftStorage.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const backup = JSON.parse(stored) as {
        userId: string;
        data: {
          conversationHistory: Array<{
            role: "user" | "assistant";
            content: string;
            timestamp: string;
          }>;
          vacancyData: {
            title?: string;
            description?: string;
            requirements?: string[];
            conditions?: string[];
            salary?: {
              min?: number;
              max?: number;
              currency?: string;
            };
          };
          currentStep: string;
        };
        savedAt: string;
      };

      // Проверить, что это черновик текущего пользователя
      if (backup.userId !== userId) {
        return null;
      }

      // Проверить, что резервная копия не старше 24 часов
      const savedAt = new Date(backup.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        LocalDraftStorage.clear();
        return null;
      }

      return {
        ...backup.data,
        conversationHistory: backup.data.conversationHistory.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };
    } catch (error) {
      console.error("Не удалось загрузить резервную копию черновика:", error);
      return null;
    }
  }

  /**
   * Удалить резервную копию черновика
   */
  static clear(): void {
    try {
      localStorage.removeItem(LocalDraftStorage.STORAGE_KEY);
    } catch (error) {
      console.error("Не удалось удалить резервную копию черновика:", error);
    }
  }

  /**
   * Проверить наличие резервной копии
   *
   * @param userId - ID пользователя
   * @returns true если есть резервная копия
   */
  static hasBackup(userId: string): boolean {
    return LocalDraftStorage.load(userId) !== null;
  }
}
