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
import SuperJSON from "superjson";
import { ZodError } from "zod";
import { AuditLoggerService } from "./services/audit-logger";
import { extractTokenFromHeaders } from "./utils/interview-token-validator";

/**
 * Создание контекста для oRPC
 *
 * Контекст содержит все зависимости, необходимые для выполнения процедур:
 * - authApi: API для работы с аутентификацией
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
export const createContext = async (opts: {
  headers: Headers;
  auth: Auth | null;
}) => {
  const authApi = opts.auth?.api;
  const session = authApi
    ? await authApi.getSession({
        headers: opts.headers,
      })
    : null;

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
    authApi,
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
 * Настраивает:
 * - SuperJSON как transformer для сериализации Date, Map, Set и других типов
 * - errorFormatter с поддержкой Zod flattenError для структурированных ошибок валидации
 *
 * @see Requirements 1.2, 1.3, 1.5
 */
const orpc = os.$context<Context>();

/**
 * Фабричная функция для создания роутеров
 * Используется для объединения процедур в роутеры
 */
export const router = orpc.router;

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
