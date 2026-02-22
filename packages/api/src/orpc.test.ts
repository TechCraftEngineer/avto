/**
 * Unit Tests для oRPC Procedures
 *
 * Этот файл содержит unit тесты для publicProcedure и protectedProcedure,
 * проверяющие поведение авторизации и выполнения процедур.
 *
 * Feature: trpc-to-orpc-migration
 * Task: 4.3 Написать unit тесты для процедур
 * @see .kiro/specs/trpc-to-orpc-migration/design.md
 * @see .kiro/specs/trpc-to-orpc-migration/requirements.md (Requirements 3.3, 3.4)
 */

import { describe, expect, it } from "bun:test";
import { call } from "@orpc/server";
import { type Context, protectedProcedure, publicProcedure } from "./orpc";

/**
 * Создает минимальный mock контекст для тестирования
 */
function createMockContext(overrides?: Partial<Context>): Context {
  return {
    authApi: null,
    session: null,
    db: {} as Context["db"],
    workspaceRepository: {} as Context["workspaceRepository"],
    organizationRepository: {} as Context["organizationRepository"],
    auditLogger: {} as Context["auditLogger"],
    ipAddress: "127.0.0.1",
    userAgent: "test-agent",
    interviewToken: null,
    inngest: {} as Context["inngest"],
    headers: new Headers(),
    ...overrides,
  } as Context;
}

describe("publicProcedure", () => {
  /**
   * Тест: publicProcedure выполняется без авторизации
   *
   * Проверяет что публичная процедура может быть выполнена
   * без наличия сессии пользователя.
   *
   * **Validates: Requirements 3.1**
   */
  it("должен выполняться без авторизации", async () => {
    // Создаем простую публичную процедуру
    const testProcedure = publicProcedure.handler(() => {
      return { success: true, message: "Публичный доступ" };
    });

    // Создаем контекст без сессии
    const mockContext = createMockContext({
      session: null,
    });

    // Выполняем процедуру
    const result = await call(testProcedure, undefined, {
      context: mockContext,
    });

    // Проверяем что процедура выполнилась успешно
    expect(result).toEqual({
      success: true,
      message: "Публичный доступ",
    });
  });

  it("должен выполняться с авторизацией (опционально)", async () => {
    // Создаем публичную процедуру которая проверяет наличие сессии
    const testProcedure = publicProcedure.handler(({ context }) => {
      return {
        authenticated: !!context.session?.user,
        userId: context.session?.user?.id,
      };
    });

    // Тест 1: Без сессии
    const mockContextNoAuth = createMockContext({
      session: null,
    });

    const resultNoAuth = await call(testProcedure, undefined, {
      context: mockContextNoAuth,
    });

    expect(resultNoAuth.authenticated).toBe(false);
    expect(resultNoAuth.userId).toBeUndefined();

    // Тест 2: С сессией
    const mockContextWithAuth = createMockContext({
      session: {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      } as Context["session"],
    });

    const resultWithAuth = await call(testProcedure, undefined, {
      context: mockContextWithAuth,
    });

    expect(resultWithAuth.authenticated).toBe(true);
    expect(resultWithAuth.userId).toBe("user-123");
  });

  it("должен иметь доступ к контексту", async () => {
    const testIpAddress = "192.168.1.1";
    const testUserAgent = "Mozilla/5.0";

    const testProcedure = publicProcedure.handler(({ context }) => {
      return {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      };
    });

    const mockContext = createMockContext({
      ipAddress: testIpAddress,
      userAgent: testUserAgent,
    });

    const result = await call(testProcedure, undefined, {
      context: mockContext,
    });

    expect(result.ipAddress).toBe(testIpAddress);
    expect(result.userAgent).toBe(testUserAgent);
  });
});

describe("protectedProcedure", () => {
  /**
   * Тест: protectedProcedure выбрасывает UNAUTHORIZED без сессии
   *
   * Проверяет что защищенная процедура выбрасывает ошибку UNAUTHORIZED
   * когда сессия пользователя отсутствует.
   *
   * **Validates: Requirements 3.3**
   */
  it("должен выбрасывать UNAUTHORIZED без сессии", async () => {
    // Создаем защищенную процедуру
    const testProcedure = protectedProcedure.handler(() => {
      return { success: true };
    });

    // Создаем контекст без сессии
    const mockContext = createMockContext({
      session: null,
    });

    // Пытаемся выполнить процедуру и ожидаем ошибку
    await expect(
      call(testProcedure, undefined, { context: mockContext }),
    ).rejects.toThrow();

    // Проверяем детали ошибки
    try {
      await call(testProcedure, undefined, { context: mockContext });
      // Не должны сюда попасть
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      // Проверяем что это ORPCError с кодом UNAUTHORIZED
      const orpcError = error as { status?: number; message?: string };
      expect(orpcError.status).toBe(401); // UNAUTHORIZED
      expect(orpcError.message).toContain("авторизация");
    }
  });

  it("должен выбрасывать UNAUTHORIZED когда session существует но user отсутствует", async () => {
    const testProcedure = protectedProcedure.handler(() => {
      return { success: true };
    });

    // Создаем контекст с session но без user
    const mockContext = createMockContext({
      session: {} as Context["session"],
    });

    // Должна выброситься ошибка
    await expect(
      call(testProcedure, undefined, { context: mockContext }),
    ).rejects.toThrow();
  });

  /**
   * Тест: protectedProcedure выполняется успешно с валидной сессией
   *
   * Проверяет что защищенная процедура успешно выполняется
   * когда предоставлена валидная сессия пользователя.
   *
   * **Validates: Requirements 3.4**
   */
  it("должен выполняться успешно с валидной сессией", async () => {
    // Создаем защищенную процедуру
    const testProcedure = protectedProcedure.handler(({ context }) => {
      return {
        success: true,
        userId: context.session.user.id,
        userEmail: context.session.user.email,
      };
    });

    // Создаем контекст с валидной сессией
    const mockContext = createMockContext({
      session: {
        user: {
          id: "user-456",
          email: "protected@example.com",
        },
      } as Context["session"],
    });

    // Выполняем процедуру
    const result = await call(testProcedure, undefined, {
      context: mockContext,
    });

    // Проверяем что процедура выполнилась успешно
    expect(result.success).toBe(true);
    expect(result.userId).toBe("user-456");
    expect(result.userEmail).toBe("protected@example.com");
  });

  it("должен гарантировать наличие context.session.user", async () => {
    // Создаем процедуру которая обращается к ctx.session.user напрямую
    // без дополнительных проверок (TypeScript должен гарантировать что это безопасно)
    const testProcedure = protectedProcedure.handler(({ context }) => {
      // Если бы ctx.session.user мог быть undefined, TypeScript выдал бы ошибку
      const userId = context.session.user.id;
      const userEmail = context.session.user.email;

      return { userId, userEmail };
    });

    const mockContext = createMockContext({
      session: {
        user: {
          id: "user-789",
          email: "guaranteed@example.com",
        },
      } as Context["session"],
    });

    const result = await call(testProcedure, undefined, {
      context: mockContext,
    });

    expect(result.userId).toBe("user-789");
    expect(result.userEmail).toBe("guaranteed@example.com");
  });

  it("должен иметь доступ ко всем полям контекста", async () => {
    const testProcedure = protectedProcedure.handler(({ context }) => {
      return {
        userId: context.session.user.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        hasDb: !!context.db,
        hasWorkspaceRepo: !!context.workspaceRepository,
      };
    });

    const mockContext = createMockContext({
      session: {
        user: {
          id: "user-999",
          email: "full-context@example.com",
        },
      } as Context["session"],
      ipAddress: "10.0.0.1",
      userAgent: "Test Agent",
    });

    const result = await call(testProcedure, undefined, {
      context: mockContext,
    });

    expect(result.userId).toBe("user-999");
    expect(result.ipAddress).toBe("10.0.0.1");
    expect(result.userAgent).toBe("Test Agent");
    expect(result.hasDb).toBe(true);
    expect(result.hasWorkspaceRepo).toBe(true);
  });

  it("должен применять все middleware из publicProcedure", async () => {
    // Этот тест проверяет что protectedProcedure наследует middleware от publicProcedure
    // Мы проверяем это косвенно через логирование

    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const testProcedure = protectedProcedure.handler(() => {
        return { success: true };
      });

      const mockContext = createMockContext({
        session: {
          user: {
            id: "user-middleware",
            email: "middleware@example.com",
          },
        } as Context["session"],
      });

      await call(testProcedure, undefined, { context: mockContext });

      // Проверяем что timing middleware сработал (логирование времени выполнения)
      const timingLog = logs.find((log) => log.includes("выполнен за"));
      expect(timingLog).toBeDefined();

      // Проверяем что security audit middleware сработал
      const auditLog = logs.find(
        (log) =>
          log.includes("Security Audit") && log.includes("user-middleware"),
      );
      expect(auditLog).toBeDefined();
    } finally {
      console.log = originalLog;
      process.env.NODE_ENV = originalEnv;
    }
  });
});

describe("Сравнение publicProcedure и protectedProcedure", () => {
  it("publicProcedure и protectedProcedure должны иметь разное поведение авторизации", async () => {
    // Создаем идентичные процедуры
    const publicProc = publicProcedure.handler(() => ({ type: "public" }));
    const protectedProc = protectedProcedure.handler(() => ({
      type: "protected",
    }));

    const mockContextNoAuth = createMockContext({
      session: null,
    });

    // publicProcedure должен работать без авторизации
    const publicResult = await call(publicProc, undefined, {
      context: mockContextNoAuth,
    });
    expect(publicResult.type).toBe("public");

    // protectedProcedure должен выбросить ошибку без авторизации
    await expect(
      call(protectedProc, undefined, { context: mockContextNoAuth }),
    ).rejects.toThrow();
  });

  it("оба типа процедур должны работать с валидной сессией", async () => {
    const publicProc = publicProcedure.handler(({ context }) => ({
      type: "public",
      hasUser: !!context.session?.user,
    }));

    const protectedProc = protectedProcedure.handler(({ context }) => ({
      type: "protected",
      userId: context.session.user.id,
    }));

    const mockContextWithAuth = createMockContext({
      session: {
        user: {
          id: "user-compare",
          email: "compare@example.com",
        },
      } as Context["session"],
    });

    // Оба должны работать
    const publicResult = await call(publicProc, undefined, {
      context: mockContextWithAuth,
    });
    expect(publicResult.type).toBe("public");
    expect(publicResult.hasUser).toBe(true);

    const protectedResult = await call(protectedProc, undefined, {
      context: mockContextWithAuth,
    });
    expect(protectedResult.type).toBe("protected");
    expect(protectedResult.userId).toBe("user-compare");
  });
});
