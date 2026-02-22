/**
 * Tenant Guard Middleware
 *
 * Обеспечивает изоляцию данных между tenant'ами (workspaces):
 * - Проверяет workspaceId для всех операций
 * - Логирует доступ для audit
 * - Предотвращает cross-tenant data leakage
 *
 * @requirements 7.1, 7.2 - Multi-tenant изоляция
 */

import { ORPCError } from "@orpc/server";
import type { DbClient, WorkspaceRepository } from "@qbs-autonaim/db";
import type { AuditLoggerService } from "../services/audit-logger";

/**
 * Результат проверки tenant доступа
 */
export interface TenantVerificationResult {
  /** Успешность проверки */
  verified: boolean;
  /** ID workspace */
  workspaceId: string;
  /** ID пользователя (если аутентифицирован) */
  userId?: string;
  /** Роль пользователя в workspace */
  role?: string;
}

/**
 * Параметры для проверки tenant доступа
 */
export interface TenantVerificationParams {
  /** ID workspace для проверки */
  workspaceId: string;
  /** ID пользователя (опционально для публичных операций) */
  userId?: string;
  /** Тип операции для логирования */
  operation: TenantOperation;
  /** ID ресурса (опционально) */
  resourceId?: string;
  /** Тип ресурса (опционально) */
  resourceType?: TenantResourceType;
  /** IP адрес клиента */
  ipAddress?: string;
  /** User agent клиента */
  userAgent?: string;
}

/**
 * Типы операций для tenant guard
 */
export type TenantOperation =
  | "session_create"
  | "session_read"
  | "session_update"
  | "resume_upload"
  | "dialogue_message"
  | "evaluation_read"
  | "evaluation_create"
  | "widget_config_read"
  | "widget_config_update"
  | "analytics_read"
  | "analytics_export"
  | "custom_domain_read"
  | "custom_domain_update"
  | "candidate_data_read"
  | "candidate_data_export";

/**
 * Типы ресурсов для tenant guard
 */
export type TenantResourceType =
  | "prequalification_session"
  | "widget_config"
  | "custom_domain"
  | "analytics_event"
  | "vacancy"
  | "vacancy_response";

/**
 * Ошибка нарушения tenant изоляции
 */
export class TenantIsolationError extends Error {
  constructor(
    public readonly code: TenantErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TenantIsolationError";
  }
}

export type TenantErrorCode =
  | "WORKSPACE_NOT_FOUND"
  | "ACCESS_DENIED"
  | "TENANT_MISMATCH"
  | "INVALID_WORKSPACE_ID";

/**
 * Tenant Guard Service
 *
 * Централизованный сервис для проверки tenant изоляции
 */
export class TenantGuard {
  constructor(
    private workspaceRepository: WorkspaceRepository,
    private auditLogger: AuditLoggerService,
    _db: DbClient,
  ) {}

  /**
   * Проверяет доступ пользователя к workspace
   *
   * @param params - Параметры проверки
   * @returns Результат проверки
   * @throws TenantIsolationError при нарушении изоляции
   */
  async verifyAccess(
    params: TenantVerificationParams,
  ): Promise<TenantVerificationResult> {
    const { workspaceId, userId, operation, resourceId, ipAddress, userAgent } =
      params;

    // Валидация workspaceId
    if (!workspaceId || typeof workspaceId !== "string") {
      await this.logAccessAttempt({
        userId,
        operation,
        workspaceId: workspaceId ?? "unknown",
        success: false,
        reason: "invalid_workspace_id",
        ipAddress,
        userAgent,
      });

      throw new TenantIsolationError(
        "INVALID_WORKSPACE_ID",
        "Некорректный идентификатор workspace",
        { workspaceId },
      );
    }

    // Проверяем существование workspace
    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      await this.logAccessAttempt({
        userId,
        operation,
        workspaceId,
        success: false,
        reason: "workspace_not_found",
        ipAddress,
        userAgent,
      });

      throw new TenantIsolationError(
        "WORKSPACE_NOT_FOUND",
        "Workspace не найден",
        { workspaceId },
      );
    }

    // Для аутентифицированных операций проверяем доступ пользователя
    if (userId) {
      const access = await this.workspaceRepository.checkAccess(
        workspaceId,
        userId,
      );

      if (!access) {
        await this.logAccessAttempt({
          userId,
          operation,
          workspaceId,
          resourceId,
          success: false,
          reason: "access_denied",
          ipAddress,
          userAgent,
        });

        throw new TenantIsolationError(
          "ACCESS_DENIED",
          "Нет доступа к данному workspace",
          { workspaceId, userId },
        );
      }

      // Логируем успешный доступ
      await this.logAccessAttempt({
        userId,
        operation,
        workspaceId,
        resourceId,
        success: true,
        ipAddress,
        userAgent,
      });

      return {
        verified: true,
        workspaceId,
        userId,
        role: access.role,
      };
    }

    // Для публичных операций (widget) просто проверяем существование workspace
    await this.logAccessAttempt({
      operation,
      workspaceId,
      resourceId,
      success: true,
      ipAddress,
      userAgent,
    });

    return {
      verified: true,
      workspaceId,
    };
  }

  /**
   * Проверяет, что ресурс принадлежит указанному workspace
   *
   * @param resourceWorkspaceId - workspaceId ресурса
   * @param requestedWorkspaceId - запрошенный workspaceId
   * @throws TenantIsolationError при несовпадении
   */
  verifyResourceOwnership(
    resourceWorkspaceId: string,
    requestedWorkspaceId: string,
  ): void {
    if (resourceWorkspaceId !== requestedWorkspaceId) {
      throw new TenantIsolationError(
        "TENANT_MISMATCH",
        "Ресурс не принадлежит указанному workspace",
        {
          resourceWorkspaceId,
          requestedWorkspaceId,
        },
      );
    }
  }

  /**
   * Создаёт фильтр для запросов с tenant изоляцией
   *
   * @param workspaceId - ID workspace для фильтрации
   * @returns Объект с workspaceId для использования в WHERE условиях
   */
  createTenantFilter(workspaceId: string): { workspaceId: string } {
    return { workspaceId };
  }

  /**
   * Логирует попытку доступа для audit
   */
  private async logAccessAttempt(params: {
    userId?: string;
    operation: TenantOperation;
    workspaceId: string;
    resourceId?: string;
    success: boolean;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.auditLogger.logAccess({
        userId: params.userId ?? "anonymous",
        action: "ACCESS",
        resourceType: "VACANCY", // Using existing enum value for tenant access
        resourceId: params.resourceId ?? params.workspaceId,
        metadata: {
          type: "tenant_access",
          operation: params.operation,
          workspaceId: params.workspaceId,
          success: params.success,
          reason: params.reason,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      // Не прерываем основной поток при ошибке логирования
      console.error("Failed to log tenant access attempt:", error);
    }
  }
}

/**
 * Создаёт экземпляр TenantGuard
 */
export function createTenantGuard(
  workspaceRepository: WorkspaceRepository,
  auditLogger: AuditLoggerService,
  db: DbClient,
): TenantGuard {
  return new TenantGuard(workspaceRepository, auditLogger, db);
}

/**
 * Утилита для преобразования TenantIsolationError в ORPCError
 */
export function toORPCError(
  error: TenantIsolationError,
): ORPCError<"NOT_FOUND" | "FORBIDDEN", unknown> {
  const codeMap: Record<TenantErrorCode, "NOT_FOUND" | "FORBIDDEN"> = {
    WORKSPACE_NOT_FOUND: "NOT_FOUND",
    ACCESS_DENIED: "FORBIDDEN",
    TENANT_MISMATCH: "FORBIDDEN",
    INVALID_WORKSPACE_ID: "NOT_FOUND",
  };

  return new ORPCError(codeMap[error.code], {
    message: error.message,
    cause: error,
  });
}

/**
 * Обёртка для безопасного выполнения операций с tenant проверкой
 *
 * @param guard - Экземпляр TenantGuard
 * @param params - Параметры проверки
 * @param operation - Функция для выполнения после успешной проверки
 * @returns Результат операции
 */
export async function withTenantGuard<T>(
  guard: TenantGuard,
  params: TenantVerificationParams,
  operation: (result: TenantVerificationResult) => Promise<T>,
): Promise<T> {
  try {
    const verificationResult = await guard.verifyAccess(params);
    return await operation(verificationResult);
  } catch (error) {
    if (error instanceof TenantIsolationError) {
      throw toORPCError(error);
    }
    throw error;
  }
}
