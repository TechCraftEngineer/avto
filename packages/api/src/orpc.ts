/**
 * oRPC Server Configuration
 *
 * Этот файл содержит конфигурацию oRPC сервера, включая:
 * - Создание контекста с зависимостями (auth, db, repositories, и т.д.)
 * - Инициализацию oRPC с трансформером и обработкой ошибок
 * - Экспорт типов и фабричных функций для роутеров и процедур
 */

import { os } from "@orpc/server";
import type { Auth } from "@qbs-autonaim/auth";
import { OrganizationRepository, WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { AuditLoggerService } from "./services/audit-logger";
import { extractTokenFromHeaders } from "./utils/interview-token-validator";
import { verifyWorkspaceAccess } from "./utils/verify-workspace-access";

export { requireWorkspaceRole } from "./utils/verify-workspace-access";

/**
 * Создание контекста для oRPC
 *
 * Контекст содержит все зависимости, необходимые для выполнения процедур:
 * - authApi: API для работы с аутентификацией (better-auth)
 * - session: Сессия пользователя (если авторизован)
 * - db: Клиент базы данных Prisma
 * - workspaceRepository: Репозиторий для работы с рабочими областями
 * - organizationRepository: Репозиторий для работы с организациями
 * - auditLogger: Сервис для логирования аудита
 * - ipAddress: IP адрес клиента
 * - userAgent: User-Agent клиента
 * - interviewToken: Токен для доступа к интервью
 * - inngest: Клиент для работы с фоновыми задачами
 * - headers: HTTP заголовки запроса
 *
 * @see Requirements 1.1, 1.4
 */
export const createContext = async (opts: { headers: Headers; auth: Auth }) => {
  const session = await opts.auth.api.getSession({
    headers: opts.headers,
  });

  // Создаем экземпляры репозиториев с db
  const workspaceRepository = new WorkspaceRepository(db);
  const organizationRepository = new OrganizationRepository(db);
  const auditLogger = new AuditLoggerService(db);

  // Извлекаем IP и User-Agent из headers
  const ipAddress =
    opts.headers.get("x-forwarded-for") ??
    opts.headers.get("x-real-ip") ??
    undefined;
  const userAgent = opts.headers.get("user-agent") ?? undefined;

  // Извлекаем interview token из headers
  const interviewToken = extractTokenFromHeaders(opts.headers);

  return {
    authApi: opts.auth.api,
    session,
    db,
    workspaceRepository,
    organizationRepository,
    auditLogger,
    ipAddress,
    userAgent,
    interviewToken,
    inngest,
    headers: opts.headers,
  };
};

/**
 * Тип контекста oRPC
 * Используется для типизации контекста в процедурах
 */
export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Инициализация oRPC с конфигурацией
 *
 * Настраивает базовый builder с контекстом и типизированными ошибками.
 * SuperJSON используется автоматически в oRPC для сериализации Date, Map, Set и других типов.
 * Zod ошибки автоматически форматируются oRPC.
 *
 * Type-safe errors: клиент получает типизацию error.data через isDefinedError.
 * ORPCError.data передаётся клиенту — не включайте чувствительные данные.
 *
 * @see https://orpc.dev/docs/error-handling
 * @see Requirements 1.2, 1.3, 1.5
 */
const orpc = os.$context<Context>().errors({
  UNAUTHORIZED: { message: "Требуется авторизация" },
  FORBIDDEN: { message: "Нет доступа" },
  NOT_FOUND: { message: "Ресурс не найден" },
  BAD_REQUEST: { message: "Некорректные данные" },
  CONFLICT: { message: "Конфликт данных" },
  TOO_MANY_REQUESTS: {
    data: z.object({ retryAfter: z.number().int().min(1) }),
    message: "Превышен лимит запросов",
  },
});

/**
 * Фабричная функция для создания роутеров
 * Используется для объединения процедур в роутеры
 */
export const router = orpc.router;

/**
 * Фабричная функция для создания роутеров (алиас для совместимости)
 */
export const createRouter = orpc.router;

/**
 * Фабричная функция для создания middleware
 * Используется для добавления промежуточной логики (логирование, аудит, и т.д.)
 */
export const middleware = orpc.middleware;

/**
 * Базовая процедура без middleware
 * Используется как основа для publicProcedure и protectedProcedure
 */
export const procedure = orpc;

/**
 * Timing Middleware
 *
 * Логирует время выполнения каждой процедуры.
 * В development режиме выводит информацию о каждом запросе.
 * Логирует предупреждения для медленных операций (>5000ms).
 *
 * @see Requirements 2.1, 2.2
 */
export const timingMiddleware = middleware(async ({ context, next, path }) => {
  const start = Date.now();
  const result = await next({});
  const end = Date.now();
  const executionTime = end - start;

  const pathStr = path.join(".");

  // Логируем в development режиме
  if (process.env.NODE_ENV === "development") {
    console.log(`[ORPC] ${pathStr} выполнен за ${executionTime}мс`);
  }

  // Предупреждение для медленных операций (>5000ms)
  if (executionTime > 5000) {
    console.warn(
      `[Performance] Slow operation detected: ${pathStr} took ${executionTime}ms | IP: ${context.ipAddress || "unknown"}`,
    );
  }

  return result;
});

/**
 * Security Headers Middleware
 *
 * Заглушка для security headers.
 * В oRPC headers устанавливаются в Next.js route handler.
 *
 * @see Requirements 2.7
 */
export const securityHeadersMiddleware = middleware(async ({ next }) => {
  const result = await next({});
  // Headers устанавливаются в Next.js route handler
  return result;
});

/**
 * Security Audit Middleware
 *
 * Логирует события безопасности:
 * - UNAUTHORIZED ошибки (попытки несанкционированного доступа)
 * - FORBIDDEN ошибки (подозрительная активность)
 * - TOO_MANY_REQUESTS ошибки (превышение rate limit)
 * - Успешные mutations для аудита модификации данных
 * - Медленные операции (>5000ms) для мониторинга производительности
 *
 * @see Requirements 2.3, 2.4, 2.5, 2.6
 */
export const securityAudit = middleware(async ({ context, next, path }) => {
  console.log("[securityAudit] START - path:", path.join("."));
  const startTime = Date.now();
  const userId = context.session?.user?.id;
  const ipAddress = context.ipAddress;
  const pathStr = path.join(".");

  // Определяем тип операции по пути (это упрощение, в реальности нужно использовать meta)
  // В oRPC meta доступен только в handler, не в middleware
  const isMutation =
    pathStr.includes("create") ||
    pathStr.includes("update") ||
    pathStr.includes("delete") ||
    pathStr.includes("remove") ||
    pathStr.includes("add");

  // В dev режиме логируем информацию о запросе
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Security Audit] ${isMutation ? "MUTATION" : "QUERY"} ${pathStr} | IP: ${ipAddress || "unknown"} | User: ${userId || "anonymous"}`,
    );
  }

  try {
    const result = await next({});

    // Логирование успешных mutations для аудита
    if (userId && isMutation) {
      const { logSecurityEvent } = await import("@qbs-autonaim/server-utils");
      logSecurityEvent.suspiciousActivity(
        {
          type: "data_modification",
          operation: "MODIFY",
          userId,
        },
        ipAddress,
        userId,
      );
    }

    return result;
  } catch (error) {
    console.error("[securityAudit] Middleware error:", error);
    console.error(
      "[securityAudit] Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );

    // Логирование нарушений безопасности
    const { ORPCError } = await import("@orpc/server");
    const { logSecurityEvent } = await import("@qbs-autonaim/server-utils");

    if (error instanceof ORPCError) {
      if (error.status === 401) {
        // UNAUTHORIZED
        console.warn(
          `[Security] UNAUTHORIZED access attempt | IP: ${ipAddress || "unknown"} | Path: ${pathStr}`,
        );
        logSecurityEvent.accessDenied(
          userId || "anonymous",
          "unknown",
          ipAddress,
        );
      } else if (error.status === 429) {
        // TOO_MANY_REQUESTS
        logSecurityEvent.rateLimitExceeded(ipAddress, userId, "unknown");
      } else if (error.status === 403) {
        // FORBIDDEN
        console.warn(
          `[Security] FORBIDDEN access | IP: ${ipAddress || "unknown"} | User: ${userId || "anonymous"} | Path: ${pathStr}`,
        );
        logSecurityEvent.suspiciousActivity(
          {
            error: error.message,
            code: error.code,
          },
          ipAddress,
          userId,
        );
      }
    }

    throw error;
  } finally {
    // Логирование медленных операций
    const executionTime = Date.now() - startTime;
    if (executionTime > 5000) {
      const { logSecurityEvent } = await import("@qbs-autonaim/server-utils");
      console.warn(
        `[Performance] Slow operation detected: ${pathStr} took ${executionTime}ms | IP: ${ipAddress || "unknown"}`,
      );
      logSecurityEvent.suspiciousActivity(
        {
          type: "slow_operation",
          executionTime,
        },
        ipAddress,
        userId,
      );
    }
  }
});

/**
 * Public Procedure
 *
 * Базовая процедура без требования авторизации.
 * Применяет middleware: timingMiddleware, securityHeadersMiddleware, securityAudit.
 * Используется для endpoints, доступных без авторизации.
 *
 * @see Requirements 3.1, 3.5
 */
export const publicProcedure = procedure
  .use(timingMiddleware)
  .use(securityHeadersMiddleware)
  .use(securityAudit);

/**
 * Protected Procedure
 *
 * Процедура с требованием авторизации.
 * Применяет все middleware из publicProcedure + проверку авторизации.
 * Гарантирует наличие ctx.session.user.
 * Выбрасывает ORPCError с кодом UNAUTHORIZED если сессия отсутствует.
 *
 * @see Requirements 3.2, 3.3, 3.4, 3.5
 */
export const protectedProcedure = publicProcedure.use(
  middleware(async ({ context, next }) => {
    if (!context.session?.user) {
      const { ORPCError } = await import("@orpc/server");
      throw new ORPCError("UNAUTHORIZED", {
        message: "Требуется авторизация",
      });
    }

    return next({
      context: {
        session: {
          ...context.session,
          user: context.session.user,
        },
      },
    });
  }),
);

/**
 * Схема input для процедур с workspaceId.
 * passthrough() позволяет добавлять поля через .merge() в дочерних процедурах.
 */
export const workspaceInputSchema = z
  .object({ workspaceId: workspaceIdSchema })
  .passthrough();

/**
 * Middleware проверки доступа к workspace.
 * Добавляет workspaceAccess в контекст — используйте requireWorkspaceRole(access, ['owner','admin']) при необходимости.
 * Экспортируется для процедур с расширенным input: .input(workspaceInputSchema.merge(...)).use(workspaceAccessMiddleware).
 */
export const workspaceAccessMiddleware = middleware(
  async ({ context, next }, input: { workspaceId: string }) => {
    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session?.user.id,
    );
    return next({ context: { workspaceAccess: access } });
  },
);

/**
 * workspaceProcedure — процедура с проверкой доступа к workspace.
 * Input должен содержать workspaceId. Для дополнительных полей используйте .input(workspaceInputSchema.merge(...)).
 *
 * @example
 * // Только workspaceId
 * export const list = workspaceProcedure.handler(async ({ input }) => {...});
 *
 * @example
 * // workspaceId + дополнительные поля
 * export const update = workspaceProcedure
 *   .input(workspaceInputSchema.merge(z.object({ id: z.string() })))
 *   .handler(async ({ input }) => {...});
 */
export const workspaceProcedure = protectedProcedure
  .input(workspaceInputSchema)
  .use(workspaceAccessMiddleware);
