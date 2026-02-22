import { ORPCError } from "@orpc/server";
import type { AuditLogger } from "../services/audit-logger";

/**
 * Категории ошибок для классификации и обработки
 */
export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  AI_SERVICE = "AI_SERVICE",
  DATABASE = "DATABASE",
  EXTERNAL_API = "EXTERNAL_API",
  INTERNAL = "INTERNAL",
}

/**
 * Уровни критичности ошибок для уведомлений администраторов
 */
export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/**
 * Интерфейс для структурированной информации об ошибке
 */
export interface ErrorDetails {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}

/**
 * Маппинг категорий ошибок на коды oRPC
 */
const ERROR_CODE_MAP: Record<
  ErrorCategory,
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
> = {
  [ErrorCategory.VALIDATION]: "BAD_REQUEST",
  [ErrorCategory.AUTHENTICATION]: "UNAUTHORIZED",
  [ErrorCategory.AUTHORIZATION]: "FORBIDDEN",
  [ErrorCategory.NOT_FOUND]: "NOT_FOUND",
  [ErrorCategory.CONFLICT]: "CONFLICT",
  [ErrorCategory.AI_SERVICE]: "INTERNAL_SERVER_ERROR",
  [ErrorCategory.DATABASE]: "INTERNAL_SERVER_ERROR",
  [ErrorCategory.EXTERNAL_API]: "INTERNAL_SERVER_ERROR",
  [ErrorCategory.INTERNAL]: "INTERNAL_SERVER_ERROR",
};

/**
 * Класс для централизованной обработки ошибок
 */
export class ErrorHandler {
  constructor(
    private auditLogger: AuditLogger,
    private userId?: string,
    private ipAddress?: string,
    private userAgent?: string,
  ) {}

  /**
   * Обрабатывает ошибку: логирует, уведомляет администраторов при необходимости и выбрасывает ORPCError
   */
  async handleError(details: ErrorDetails): Promise<never> {
    // Логируем ошибку
    await this.logError(details);

    // Уведомляем администраторов для критических ошибок
    if (
      details.severity === ErrorSeverity.CRITICAL ||
      details.severity === ErrorSeverity.HIGH
    ) {
      await this.notifyAdministrators(details);
    }

    // Выбрасываем ORPCError с соответствующим кодом
    const code = ERROR_CODE_MAP[details.category];
    throw new ORPCError(code, {
      message: details.userMessage,
      cause: details.originalError,
    });
  }

  /**
   * Логирует ошибку в audit log
   */
  private async logError(details: ErrorDetails): Promise<void> {
    try {
      await this.auditLogger.logError({
        userId: this.userId,
        category: details.category,
        severity: details.severity,
        message: details.message,
        userMessage: details.userMessage,
        context: details.context,
        stack: details.originalError?.stack,
        ipAddress: this.ipAddress,
        userAgent: this.userAgent,
      });
    } catch (loggingError) {
      // Не даём ошибке логирования сломать основной поток
      console.error("Failed to log error:", loggingError);
    }
  }

  /**
   * Отправляет уведомление администраторам о критической ошибке
   */
  private async notifyAdministrators(details: ErrorDetails): Promise<void> {
    try {
      // Логируем критическую ошибку
      console.error("CRITICAL ERROR - Admin notification required:", {
        category: details.category,
        severity: details.severity,
        message: details.message,
        context: details.context,
        timestamp: new Date().toISOString(),
      });

      // TODO: Отправить уведомление через Inngest
      // await this.inngest.send({
      //   name: "admin/error.notify",
      //   data: {
      //     category: details.category,
      //     severity: details.severity,
      //     message: details.message,
      //     userMessage: details.userMessage,
      //     context: details.context,
      //     stack: details.originalError?.stack,
      //     userId: this.userId,
      //     ipAddress: this.ipAddress,
      //     userAgent: this.userAgent,
      //     timestamp: new Date().toISOString(),
      //   },
      // });
    } catch (notificationError) {
      console.error("Failed to notify administrators:", notificationError);
    }
  }

  /**
   * Обрабатывает ошибку валидации
   */
  async handleValidationError(
    message: string,
    context?: Record<string, unknown>,
  ): Promise<never> {
    return this.handleError({
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: `Validation error: ${message}`,
      userMessage: message,
      context,
    });
  }

  /**
   * Обрабатывает ошибку "не найдено"
   */
  async handleNotFoundError(
    resource: string,
    context?: Record<string, unknown>,
  ): Promise<never> {
    return this.handleError({
      category: ErrorCategory.NOT_FOUND,
      severity: ErrorSeverity.LOW,
      message: `Resource not found: ${resource}`,
      userMessage: `${resource} не найден`,
      context,
    });
  }

  /**
   * Обрабатывает ошибку доступа
   */
  async handleAuthorizationError(
    resource: string,
    context?: Record<string, unknown>,
  ): Promise<never> {
    return this.handleError({
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      message: `Authorization failed for: ${resource}`,
      userMessage: `Нет доступа к ${resource}`,
      context,
    });
  }

  /**
   * Обрабатывает ошибку конфликта (дубликат)
   */
  async handleConflictError(
    message: string,
    context?: Record<string, unknown>,
  ): Promise<never> {
    return this.handleError({
      category: ErrorCategory.CONFLICT,
      severity: ErrorSeverity.LOW,
      message: `Conflict: ${message}`,
      userMessage: message,
      context,
    });
  }

  /**
   * Обрабатывает ошибку AI-сервиса
   */
  async handleAIServiceError(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<never> {
    return this.handleError({
      category: ErrorCategory.AI_SERVICE,
      severity: ErrorSeverity.HIGH,
      message: `AI service error: ${error.message}`,
      userMessage:
        "Произошла ошибка при обработке AI-запроса. Попробуйте повторить позже.",
      context,
      originalError: error,
    });
  }

  /**
   * Обрабатывает ошибку базы данных
   */
  async handleDatabaseError(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<never> {
    return this.handleError({
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.CRITICAL,
      message: `Database error: ${error.message}`,
      userMessage:
        "Произошла ошибка при работе с базой данных. Попробуйте повторить позже.",
      context,
      originalError: error,
    });
  }

  /**
   * Обрабатывает внутреннюю ошибку сервера
   */
  async handleInternalError(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<never> {
    return this.handleError({
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.HIGH,
      message: `Internal error: ${error.message}`,
      userMessage:
        "Произошла внутренняя ошибка сервера. Попробуйте повторить позже.",
      context,
      originalError: error,
    });
  }
}

/**
 * Создаёт экземпляр ErrorHandler с контекстом
 */
export function createErrorHandler(
  auditLogger: AuditLogger,
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
): ErrorHandler {
  return new ErrorHandler(auditLogger, userId, ipAddress, userAgent);
}
