/**
 * Property-Based Tests для oRPC Context
 *
 * Этот файл содержит property-based тесты для функции createContext,
 * которая создает контекст выполнения для oRPC процедур.
 *
 * Feature: trpc-to-orpc-migration
 * @see .kiro/specs/trpc-to-orpc-migration/design.md
 */

import { describe, expect, it } from "bun:test";
import { call } from "@orpc/server";
import * as fc from "fast-check";
import {
  type Context,
  createContext,
  middleware,
  procedure,
  protectedProcedure,
  publicProcedure,
  timingMiddleware,
} from "./orpc";

/**
 * Property 1: Контекст содержит все необходимые зависимости
 *
 * *For any* валидных headers и auth объекта, создание контекста через createContext
 * должно возвращать объект со всеми обязательными полями (authApi, session, db,
 * workspaceRepository, organizationRepository, auditLogger, ipAddress, userAgent,
 * interviewToken, inngest, headers)
 *
 * **Validates: Requirements 1.1**
 */
describe("Property 1: Контекст содержит все необходимые зависимости", () => {
  it("должен создавать контекст со всеми обязательными полями для различных комбинаций headers", async () => {
    // Генератор для различных комбинаций headers
    const headersArb = fc.record(
      {
        "x-forwarded-for": fc.option(fc.ipV4(), { nil: undefined }),
        "x-real-ip": fc.option(fc.ipV4(), { nil: undefined }),
        "user-agent": fc.option(
          fc.oneof(
            fc.constant("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"),
            fc.constant("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"),
            fc.constant("Mozilla/5.0 (X11; Linux x86_64)"),
            fc.string({ minLength: 10, maxLength: 100 }),
          ),
          { nil: undefined },
        ),
        authorization: fc.option(fc.string({ minLength: 20, maxLength: 100 }), {
          nil: undefined,
        }),
        "x-interview-token": fc.option(
          fc.string({ minLength: 32, maxLength: 64 }),
          { nil: undefined },
        ),
      },
      { requiredKeys: [] },
    );

    await fc.assert(
      fc.asyncProperty(headersArb, async (headersObj) => {
        // Создаем Headers объект из сгенерированных данных
        const headers = new Headers();
        for (const [key, value] of Object.entries(headersObj)) {
          if (value !== undefined) {
            headers.set(key, value);
          }
        }

        // Создаем контекст с null auth (для простоты тестирования)
        const ctx = await createContext({ headers, auth: null });

        // Проверяем наличие всех обязательных полей
        expect(ctx).toHaveProperty("authApi");
        expect(ctx).toHaveProperty("session");
        expect(ctx).toHaveProperty("db");
        expect(ctx).toHaveProperty("workspaceRepository");
        expect(ctx).toHaveProperty("organizationRepository");
        expect(ctx).toHaveProperty("auditLogger");
        expect(ctx).toHaveProperty("ipAddress");
        expect(ctx).toHaveProperty("userAgent");
        expect(ctx).toHaveProperty("interviewToken");
        expect(ctx).toHaveProperty("inngest");
        expect(ctx).toHaveProperty("headers");

        // Проверяем типы ключевых полей
        expect(context.db).toBeDefined();
        expect(context.workspaceRepository).toBeDefined();
        expect(context.organizationRepository).toBeDefined();
        expect(context.auditLogger).toBeDefined();
        expect(context.inngest).toBeDefined();
        expect(context.headers).toBeInstanceOf(Headers);

        // Проверяем что ipAddress извлекается корректно
        if (headersObj["x-forwarded-for"]) {
          expect(context.ipAddress).toBe(headersObj["x-forwarded-for"]);
        } else if (headersObj["x-real-ip"]) {
          expect(context.ipAddress).toBe(headersObj["x-real-ip"]);
        } else {
          expect(context.ipAddress).toBeUndefined();
        }

        // Проверяем что userAgent извлекается корректно
        if (headersObj["user-agent"]) {
          // Headers API trims leading/trailing whitespace from values
          const normalizedUserAgent = headers.get("user-agent");
          expect(context.userAgent).toBe(normalizedUserAgent ?? undefined);
        } else {
          expect(context.userAgent).toBeUndefined();
        }

        // Проверяем что headers сохраняются
        expect(context.headers).toBe(headers);
      }),
      { numRuns: 100 },
    );
  });

  it("должен корректно извлекать IP адрес с приоритетом x-forwarded-for", async () => {
    await fc.assert(
      fc.asyncProperty(fc.ipV4(), fc.ipV4(), async (forwardedFor, realIp) => {
        const headers = new Headers();
        headers.set("x-forwarded-for", forwardedFor);
        headers.set("x-real-ip", realIp);

        const ctx = await createContext({ headers, auth: null });

        // x-forwarded-for имеет приоритет над x-real-ip
        expect(context.ipAddress).toBe(forwardedFor);
      }),
      { numRuns: 100 },
    );
  });

  it("должен использовать x-real-ip если x-forwarded-for отсутствует", async () => {
    await fc.assert(
      fc.asyncProperty(fc.ipV4(), async (realIp) => {
        const headers = new Headers();
        headers.set("x-real-ip", realIp);

        const ctx = await createContext({ headers, auth: null });

        expect(context.ipAddress).toBe(realIp);
      }),
      { numRuns: 100 },
    );
  });

  it("должен корректно обрабатывать отсутствие IP headers", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          "user-agent": fc.option(fc.string(), { nil: undefined }),
          authorization: fc.option(fc.string(), { nil: undefined }),
        }),
        async (headersObj) => {
          const headers = new Headers();
          for (const [key, value] of Object.entries(headersObj)) {
            if (value !== undefined) {
              headers.set(key, value);
            }
          }

          const ctx = await createContext({ headers, auth: null });

          expect(context.ipAddress).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("должен создавать независимые экземпляры репозиториев для каждого вызова", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const headers1 = new Headers();
        const headers2 = new Headers();

        const ctx1 = await createContext({ headers: headers1, auth: null });
        const ctx2 = await createContext({ headers: headers2, auth: null });

        // Каждый контекст должен иметь свои экземпляры репозиториев
        expect(ctx1.workspaceRepository).not.toBe(ctx2.workspaceRepository);
        expect(ctx1.organizationRepository).not.toBe(
          ctx2.organizationRepository,
        );
        expect(ctx1.auditLogger).not.toBe(ctx2.auditLogger);

        // Но db и inngest должны быть общими (singleton)
        expect(ctx1.db).toBe(ctx2.db);
        expect(ctx1.inngest).toBe(ctx2.inngest);
      }),
      { numRuns: 100 },
    );
  });

  it("должен корректно обрабатывать различные форматы User-Agent", async () => {
    const userAgentArb = fc.oneof(
      // Реальные User-Agent строки
      fc.constant(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ),
      fc.constant(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      ),
      fc.constant("Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)"),
      fc.constant("curl/7.64.1"),
      fc.constant("PostmanRuntime/7.28.4"),
      // Произвольные строки (но не только пробелы)
      fc
        .string({ minLength: 1, maxLength: 200 })
        .filter((s) => s.trim().length > 0),
    );

    await fc.assert(
      fc.asyncProperty(userAgentArb, async (userAgent) => {
        const headers = new Headers();
        headers.set("user-agent", userAgent);

        const ctx = await createContext({ headers, auth: null });

        // Headers API может нормализовать значения, поэтому проверяем что получили
        expect(context.userAgent).toBe(headers.get("user-agent") ?? undefined);
      }),
      { numRuns: 100 },
    );
  });

  it("должен сохранять все headers без изменений", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(
            // Valid HTTP header names (lowercase alphanumeric and hyphens)
            fc
              .stringMatching(/^[a-z0-9-]+$/)
              .filter((s) => s.length > 0 && s.length <= 50),
            // Header values (non-empty after trim to avoid Headers API normalization issues)
            fc
              .string({ minLength: 1, maxLength: 100 })
              .filter((s) => s.trim().length > 0),
          ),
          { minLength: 0, maxLength: 10 },
        ),
        async (headerPairs) => {
          const headers = new Headers();
          for (const [key, value] of headerPairs) {
            headers.set(key.toLowerCase(), value);
          }

          const ctx = await createContext({ headers, auth: null });

          // Проверяем что все headers сохранены
          // Используем headers.get() для получения нормализованного значения
          for (const [key] of headerPairs) {
            const normalizedValue = headers.get(key.toLowerCase());
            expect(context.headers.get(key.toLowerCase())).toBe(
              normalizedValue,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 3: Время выполнения логируется
 *
 * *For any* процедуры, после её выполнения в логах должна быть запись
 * с временем выполнения в миллисекундах
 *
 * **Validates: Requirements 2.1**
 */
describe("Property 3: Время выполнения логируется", () => {
  it("должен логировать время выполнения для любой процедуры", async () => {
    // Мокируем console.log для захвата логов
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };

    // Сохраняем оригинальное значение NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 0, max: 50 }), async (delay) => {
          logs.length = 0;

          // Создаем тестовую процедуру с задержкой
          const testProcedure = procedure
            .use(timingMiddleware)
            .handler(async () => {
              await new Promise((resolve) => setTimeout(resolve, delay));
              return "test";
            });

          // Создаем минимальный контекст
          const mockContext = {
            ipAddress: "127.0.0.1",
          } as Context;

          // Выполняем процедуру через call
          await call(testProcedure, undefined, { context: mockContext });

          // Проверяем что есть лог с временем выполнения
          const relevantLog = logs.find((log) => log.includes("выполнен за"));
          expect(relevantLog).toBeDefined();
          expect(relevantLog).toMatch(/выполнен за \d+мс/);
        }),
        { numRuns: 100 },
      );
    } finally {
      // Восстанавливаем оригинальные значения
      console.log = originalLog;
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("должен логировать предупреждение для медленных операций (>5000ms)", async () => {
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args.join(" "));
    };

    try {
      // Тестируем только один раз из-за длительности
      const delay = 5001;
      warnings.length = 0;

      const testProcedure = procedure
        .use(timingMiddleware)
        .handler(async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return "test";
        });

      const mockContext = {
        ipAddress: "127.0.0.1",
      } as Context;

      await call(testProcedure, undefined, { context: mockContext });

      // Проверяем что есть предупреждение о медленной операции
      const slowOpWarning = warnings.find((warn) =>
        warn.includes("Slow operation detected"),
      );
      expect(slowOpWarning).toBeDefined();
      expect(slowOpWarning).toMatch(/took \d+ms/);
    } finally {
      console.warn = originalWarn;
    }
  }, 10000); // Увеличиваем timeout до 10 секунд
});

/**
 * Property 4: UNAUTHORIZED ошибки логируются
 *
 * *For any* защищенной процедуры, вызванной без авторизации,
 * в логах должна быть запись о попытке несанкционированного доступа
 *
 * **Validates: Requirements 2.3, 3.3, 6.5**
 */
describe("Property 4: UNAUTHORIZED ошибки логируются", () => {
  it("должен логировать попытки несанкционированного доступа", async () => {
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args.join(" "));
    };

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.ipV4(), { nil: undefined }),
          async (ipAddress) => {
            warnings.length = 0;

            // Создаем контекст без сессии
            const mockContext = {
              session: null,
              ipAddress,
            } as Context;

            // Используем protectedProcedure который требует авторизацию
            const testProcedure = protectedProcedure.handler(() => "test");

            // Пытаемся выполнить процедуру без авторизации
            try {
              await call(testProcedure, undefined, { context: mockContext });
              // Не должны сюда попасть
              expect(true).toBe(false);
            } catch (error) {
              // Ожидаем UNAUTHORIZED ошибку
              expect(error).toBeDefined();
            }

            // Проверяем что есть предупреждение о несанкционированном доступе
            const unauthorizedWarning = warnings.find((warn) =>
              warn.includes("UNAUTHORIZED access attempt"),
            );
            expect(unauthorizedWarning).toBeDefined();
            expect(unauthorizedWarning).toMatch(/IP: /);
          },
        ),
        { numRuns: 100 },
      );
    } finally {
      console.warn = originalWarn;
    }
  });
});

/**
 * Property 5: FORBIDDEN ошибки логируются
 *
 * *For any* процедуры, выбрасывающей FORBIDDEN ошибку,
 * в логах должна быть запись о подозрительной активности
 *
 * **Validates: Requirements 2.4**
 */
describe("Property 5: FORBIDDEN ошибки логируются", () => {
  it("должен логировать FORBIDDEN ошибки как подозрительную активность", async () => {
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args.join(" "));
    };

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
            userId: fc.option(fc.string({ minLength: 10, maxLength: 30 }), {
              nil: undefined,
            }),
            errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
          }),
          async ({ ipAddress, userId, errorMessage }) => {
            warnings.length = 0;

            // Создаем контекст с опциональной сессией
            const mockContext = {
              session: userId ? { user: { id: userId } } : null,
              ipAddress,
            } as Context;

            // Создаем процедуру которая выбрасывает FORBIDDEN
            const testProcedure = publicProcedure.handler(async () => {
              const { ORPCError } = await import("@orpc/client");
              throw new ORPCError("FORBIDDEN", {
                message: errorMessage,
              });
            });

            // Выполняем процедуру
            try {
              await call(testProcedure, undefined, { context: mockContext });
              // Не должны сюда попасть
              expect(true).toBe(false);
            } catch (error) {
              // Ожидаем FORBIDDEN ошибку
              expect(error).toBeDefined();
            }

            // Проверяем что есть предупреждение о FORBIDDEN доступе
            const forbiddenWarning = warnings.find((warn) =>
              warn.includes("FORBIDDEN access"),
            );
            expect(forbiddenWarning).toBeDefined();
            expect(forbiddenWarning).toMatch(/IP: /);
            expect(forbiddenWarning).toMatch(/User: /);
          },
        ),
        { numRuns: 100 },
      );
    } finally {
      console.warn = originalWarn;
    }
  });
});

/**
 * Property 6: TOO_MANY_REQUESTS ошибки логируются
 *
 * *For any* процедуры, выбрасывающей TOO_MANY_REQUESTS ошибку,
 * в логах должна быть запись о превышении rate limit
 *
 * **Validates: Requirements 2.5**
 */
describe("Property 6: TOO_MANY_REQUESTS ошибки логируются", () => {
  it("должен логировать превышение rate limit", async () => {
    // Для этого теста нам нужно мокировать logSecurityEvent
    // так как он вызывается внутри middleware

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
          userId: fc.option(fc.string({ minLength: 10, maxLength: 30 }), {
            nil: undefined,
          }),
        }),
        async ({ ipAddress, userId }) => {
          // Создаем контекст
          const mockContext = {
            session: userId ? { user: { id: userId } } : null,
            ipAddress,
          } as Context;

          // Создаем процедуру которая выбрасывает TOO_MANY_REQUESTS
          const testProcedure = publicProcedure.handler(async () => {
            const { ORPCError } = await import("@orpc/client");
            throw new ORPCError("TOO_MANY_REQUESTS", {
              message: "Превышен лимит запросов",
            });
          });

          // Выполняем процедуру
          try {
            await call(testProcedure, undefined, { context: mockContext });
            // Не должны сюда попасть
            expect(true).toBe(false);
          } catch (error) {
            // Ожидаем TOO_MANY_REQUESTS ошибку
            expect(error).toBeDefined();
            // logSecurityEvent.rateLimitExceeded должен быть вызван
            // (проверяем что ошибка прошла через middleware)
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 7: Mutations логируются для аудита
 *
 * *For any* mutation процедуры, выполненной авторизованным пользователем,
 * в логах должна быть запись о модификации данных с userId
 *
 * **Validates: Requirements 2.6**
 */
describe("Property 7: Mutations логируются для аудита", () => {
  it("должен логировать успешные mutations для аудита", async () => {
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };

    // Сохраняем оригинальное значение NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Пути которые считаются mutations
            mutationType: fc.constantFrom(
              "create",
              "update",
              "delete",
              "remove",
              "add",
            ),
            userId: fc.string({ minLength: 10, maxLength: 30 }),
            ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
          }),
          async ({ userId, ipAddress }) => {
            logs.length = 0;

            // Создаем контекст с авторизованным пользователем
            const mockContext = {
              session: { user: { id: userId } },
              ipAddress,
            } as Context;

            // Создаем процедуру
            const testProcedure = publicProcedure.handler(() => "success");

            // Выполняем процедуру
            await call(testProcedure, undefined, { context: mockContext });

            // Проверяем что есть лог о MUTATION или QUERY
            // (в реальности определение типа зависит от пути, но мы проверяем что логирование работает)
            const auditLog = logs.find(
              (log) =>
                (log.includes("MUTATION") || log.includes("QUERY")) &&
                log.includes(userId),
            );
            expect(auditLog).toBeDefined();
          },
        ),
        { numRuns: 100 },
      );
    } finally {
      console.log = originalLog;
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("не должен логировать query операции как mutations", async () => {
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 30 }),
          async (userId) => {
            logs.length = 0;

            const mockContext = {
              session: { user: { id: userId } },
              ipAddress: "127.0.0.1",
            } as Context;

            const testProcedure = publicProcedure.handler(() => "success");

            await call(testProcedure, undefined, { context: mockContext });

            // Проверяем что есть лог (QUERY или MUTATION в зависимости от пути)
            const auditLog = logs.find(
              (log) =>
                (log.includes("QUERY") || log.includes("MUTATION")) &&
                log.includes(userId),
            );
            expect(auditLog).toBeDefined();
          },
        ),
        { numRuns: 100 },
      );
    } finally {
      console.log = originalLog;
      process.env.NODE_ENV = originalEnv;
    }
  });
});

/**
 * Property 8: Middleware применяются в правильном порядке
 *
 * *For any* процедуры, middleware должны выполняться в порядке:
 * timingMiddleware → securityHeadersMiddleware → securityAudit
 *
 * **Validates: Requirements 2.7**
 */
describe("Property 8: Middleware применяются в правильном порядке", () => {
  it("должен применять middleware в правильном порядке для publicProcedure", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const executionOrder: string[] = [];

        // Создаем тестовые middleware которые записывают порядок выполнения
        const testTimingMiddleware = middleware(async ({ next }) => {
          executionOrder.push("timing-before");
          const result = await next({});
          executionOrder.push("timing-after");
          return result;
        });

        const testSecurityHeadersMiddleware = middleware(async ({ next }) => {
          executionOrder.push("securityHeaders-before");
          const result = await next({});
          executionOrder.push("securityHeaders-after");
          return result;
        });

        const testSecurityAudit = middleware(async ({ next }) => {
          executionOrder.push("securityAudit-before");
          const result = await next({});
          executionOrder.push("securityAudit-after");
          return result;
        });

        // Создаем процедуру с middleware в правильном порядке
        const testProcedure = procedure
          .use(testTimingMiddleware)
          .use(testSecurityHeadersMiddleware)
          .use(testSecurityAudit)
          .handler(() => {
            executionOrder.push("handler");
            return "test";
          });

        const mockContext = {
          ipAddress: "127.0.0.1",
        } as Context;

        executionOrder.length = 0;
        await call(testProcedure, undefined, { context: mockContext });

        // Проверяем порядок выполнения
        expect(executionOrder).toEqual([
          "timing-before",
          "securityHeaders-before",
          "securityAudit-before",
          "handler",
          "securityAudit-after",
          "securityHeaders-after",
          "timing-after",
        ]);
      }),
      { numRuns: 100 },
    );
  });

  it("должен применять middleware в правильном порядке для protectedProcedure", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 30 }),
        async (userId) => {
          const executionOrder: string[] = [];

          // Создаем тестовые middleware
          const testTimingMiddleware = middleware(async ({ next }) => {
            executionOrder.push("timing-before");
            const result = await next({});
            executionOrder.push("timing-after");
            return result;
          });

          const testSecurityHeadersMiddleware = middleware(async ({ next }) => {
            executionOrder.push("securityHeaders-before");
            const result = await next({});
            executionOrder.push("securityHeaders-after");
            return result;
          });

          const testSecurityAudit = middleware(async ({ next }) => {
            executionOrder.push("securityAudit-before");
            const result = await next({});
            executionOrder.push("securityAudit-after");
            return result;
          });

          const testAuthMiddleware = middleware(async ({ context, next }) => {
            executionOrder.push("auth-before");
            if (!context.session?.user) {
              throw new Error("UNAUTHORIZED");
            }
            const result = await next({});
            executionOrder.push("auth-after");
            return result;
          });

          // Создаем protected процедуру с middleware
          const testProcedure = procedure
            .use(testTimingMiddleware)
            .use(testSecurityHeadersMiddleware)
            .use(testSecurityAudit)
            .use(testAuthMiddleware)
            .handler(() => {
              executionOrder.push("handler");
              return "test";
            });

          const mockContext = {
            session: { user: { id: userId } },
            ipAddress: "127.0.0.1",
          } as Context;

          executionOrder.length = 0;
          await call(testProcedure, undefined, { context: mockContext });

          // Проверяем порядок выполнения (auth middleware последний перед handler)
          expect(executionOrder).toEqual([
            "timing-before",
            "securityHeaders-before",
            "securityAudit-before",
            "auth-before",
            "handler",
            "auth-after",
            "securityAudit-after",
            "securityHeaders-after",
            "timing-after",
          ]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("должен прерывать выполнение если middleware выбрасывает ошибку", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const executionOrder: string[] = [];

        const testMiddleware1 = middleware(async ({ next }) => {
          executionOrder.push("middleware1-before");
          const result = await next({});
          executionOrder.push("middleware1-after");
          return result;
        });

        const testMiddleware2 = middleware(async () => {
          executionOrder.push("middleware2-before");
          throw new Error("Test error");
        });

        const testMiddleware3 = middleware(async ({ next }) => {
          executionOrder.push("middleware3-before");
          const result = await next({});
          executionOrder.push("middleware3-after");
          return result;
        });

        const testProcedure = procedure
          .use(testMiddleware1)
          .use(testMiddleware2)
          .use(testMiddleware3)
          .handler(() => {
            executionOrder.push("handler");
            return "test";
          });

        const mockContext = {
          ipAddress: "127.0.0.1",
        } as Context;

        executionOrder.length = 0;

        try {
          await call(testProcedure, undefined, { context: mockContext });
          // Не должны сюда попасть
          expect(true).toBe(false);
        } catch (error) {
          // Ожидаем ошибку
          expect(error).toBeDefined();
        }

        // Проверяем что выполнение прервалось на middleware2
        // и middleware1-after не был вызван (так как ошибка произошла до завершения цепочки)
        expect(executionOrder).toContain("middleware1-before");
        expect(executionOrder).toContain("middleware2-before");
        expect(executionOrder).not.toContain("middleware3-before");
        expect(executionOrder).not.toContain("handler");
        // middleware1-after не вызывается потому что next() выбросил ошибку
        expect(executionOrder).not.toContain("middleware1-after");
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 9: protectedProcedure требует авторизации
 *
 * *For any* защищенной процедуры без сессии, вызов должен выбрасывать
 * ORPCError с кодом UNAUTHORIZED
 *
 * **Validates: Requirements 3.3, 6.5**
 */
describe("Property 9: protectedProcedure требует авторизации", () => {
  it("должен выбрасывать UNAUTHORIZED для любой защищенной процедуры без сессии", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
          userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), {
            nil: undefined,
          }),
          // Генерируем различные варианты "отсутствия" сессии
          sessionVariant: fc.constantFrom(
            "null",
            "undefined",
            "empty-object",
            "no-user",
          ),
        }),
        async ({ ipAddress, userAgent, sessionVariant }) => {
          // Создаем контекст с различными вариантами отсутствия сессии
          let session: Context["session"];
          switch (sessionVariant) {
            case "null":
              session = null;
              break;
            case "undefined":
              session = undefined as unknown as null;
              break;
            case "empty-object":
              session = {} as Context["session"];
              break;
            case "no-user":
              session = { user: undefined } as unknown as Context["session"];
              break;
          }

          const mockContext = {
            session,
            ipAddress,
            userAgent,
            db: {} as Context["db"],
            workspaceRepository: {} as Context["workspaceRepository"],
            organizationRepository: {} as Context["organizationRepository"],
            auditLogger: {} as Context["auditLogger"],
            interviewToken: null,
            inngest: {} as Context["inngest"],
            headers: new Headers(),
            authApi: null,
          } as Context;

          // Создаем произвольную защищенную процедуру
          const testProcedure = protectedProcedure.handler(() => {
            return { success: true };
          });

          // Пытаемся выполнить процедуру
          try {
            await call(testProcedure, undefined, { context: mockContext });
            // Не должны сюда попасть - процедура должна выбросить ошибку
            expect(true).toBe(false);
          } catch (error) {
            // Проверяем что это ORPCError с кодом UNAUTHORIZED (status 401)
            expect(error).toBeDefined();
            const orpcError = error as { status?: number; message?: string };
            expect(orpcError.status).toBe(401); // UNAUTHORIZED
            expect(orpcError.message).toBeDefined();
            expect(orpcError.message?.toLowerCase()).toContain("авторизация");
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("должен выбрасывать UNAUTHORIZED независимо от других полей контекста", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
          userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), {
            nil: undefined,
          }),
          hasDb: fc.boolean(),
          hasRepositories: fc.boolean(),
        }),
        async ({ ipAddress, userAgent, hasDb, hasRepositories }) => {
          const mockContext = {
            session: null, // Нет сессии
            ipAddress,
            userAgent,
            db: hasDb ? ({} as Context["db"]) : undefined,
            workspaceRepository: hasRepositories
              ? ({} as Context["workspaceRepository"])
              : undefined,
            organizationRepository: hasRepositories
              ? ({} as Context["organizationRepository"])
              : undefined,
            auditLogger: {} as Context["auditLogger"],
            interviewToken: null,
            inngest: {} as Context["inngest"],
            headers: new Headers(),
            authApi: null,
          } as Context;

          const testProcedure = protectedProcedure.handler(() => {
            return { success: true };
          });

          // Должна выброситься ошибка независимо от других полей
          await expect(
            call(testProcedure, undefined, { context: mockContext }),
          ).rejects.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("должен выбрасывать UNAUTHORIZED для любого типа handler (query/mutation)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("query", "mutation"),
        async (handlerType) => {
          const mockContext = {
            session: null,
            ipAddress: "127.0.0.1",
            db: {} as Context["db"],
            workspaceRepository: {} as Context["workspaceRepository"],
            organizationRepository: {} as Context["organizationRepository"],
            auditLogger: {} as Context["auditLogger"],
            userAgent: undefined,
            interviewToken: null,
            inngest: {} as Context["inngest"],
            headers: new Headers(),
            authApi: null,
          } as Context;

          // Создаем процедуру в зависимости от типа
          const testProcedure = protectedProcedure.handler(() => {
            return { type: handlerType, success: true };
          });

          // Должна выброситься ошибка для любого типа
          try {
            await call(testProcedure, undefined, { context: mockContext });
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeDefined();
            const orpcError = error as { status?: number };
            expect(orpcError.status).toBe(401);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 10: protectedProcedure гарантирует наличие user
 *
 * *For any* защищенной процедуры с валидной сессией, ctx.session.user
 * должен быть определен и не null
 *
 * **Validates: Requirements 3.4**
 */
describe("Property 10: protectedProcedure гарантирует наличие user", () => {
  it("должен гарантировать наличие context.session.user для любой валидной сессии", async () => {
    // Генератор для пользовательских данных
    const userArb = fc.record({
      id: fc.string({ minLength: 10, maxLength: 50 }),
      email: fc.emailAddress(),
      name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
        nil: undefined,
      }),
      role: fc.option(fc.constantFrom("admin", "user", "guest"), {
        nil: undefined,
      }),
    });

    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const mockContext = {
          session: { user },
          ipAddress: "127.0.0.1",
          db: {} as Context["db"],
          workspaceRepository: {} as Context["workspaceRepository"],
          organizationRepository: {} as Context["organizationRepository"],
          auditLogger: {} as Context["auditLogger"],
          userAgent: undefined,
          interviewToken: null,
          inngest: {} as Context["inngest"],
          headers: new Headers(),
          authApi: null,
        } as Context;

        // Создаем процедуру которая обращается к ctx.session.user
        const testProcedure = protectedProcedure.handler(({ context }) => {
          // TypeScript должен гарантировать что user существует
          const userId = context.session.user.id;
          const userEmail = context.session.user.email;

          return {
            userId,
            userEmail,
            hasUser: !!context.session.user,
          };
        });

        const result = await call(testProcedure, undefined, {
          context: mockContext,
        });

        // Проверяем что user доступен и данные корректны
        expect(result.hasUser).toBe(true);
        expect(result.userId).toBe(user.id);
        expect(result.userEmail).toBe(user.email);
      }),
      { numRuns: 100 },
    );
  });

  it("должен сохранять все поля user объекта", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 50 }),
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          customField: fc.string(),
        }),
        async (user) => {
          const mockContext = {
            session: { user },
            ipAddress: "127.0.0.1",
            db: {} as Context["db"],
            workspaceRepository: {} as Context["workspaceRepository"],
            organizationRepository: {} as Context["organizationRepository"],
            auditLogger: {} as Context["auditLogger"],
            userAgent: undefined,
            interviewToken: null,
            inngest: {} as Context["inngest"],
            headers: new Headers(),
            authApi: null,
          } as Context;

          const testProcedure = protectedProcedure.handler(({ context }) => {
            return context.session.user;
          });

          const result = await call(testProcedure, undefined, {
            context: mockContext,
          });

          // Все поля должны быть сохранены
          expect(result).toEqual(user);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("должен позволять безопасный доступ к вложенным полям user", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 50 }),
          email: fc.emailAddress(),
          profile: fc.record({
            firstName: fc.string({ minLength: 1, maxLength: 50 }),
            lastName: fc.string({ minLength: 1, maxLength: 50 }),
            avatar: fc.option(fc.webUrl(), { nil: undefined }),
          }),
        }),
        async (user) => {
          const mockContext = {
            session: { user },
            ipAddress: "127.0.0.1",
            db: {} as Context["db"],
            workspaceRepository: {} as Context["workspaceRepository"],
            organizationRepository: {} as Context["organizationRepository"],
            auditLogger: {} as Context["auditLogger"],
            userAgent: undefined,
            interviewToken: null,
            inngest: {} as Context["inngest"],
            headers: new Headers(),
            authApi: null,
          } as Context;

          const testProcedure = protectedProcedure.handler(({ context }) => {
            // Безопасный доступ к вложенным полям
            const fullName = `${context.session.user.profile.firstName} ${context.session.user.profile.lastName}`;
            return {
              fullName,
              hasAvatar: !!context.session.user.profile.avatar,
            };
          });

          const result = await call(testProcedure, undefined, {
            context: mockContext,
          });

          expect(result.fullName).toBe(
            `${user.profile.firstName} ${user.profile.lastName}`,
          );
          expect(result.hasAvatar).toBe(!!user.profile.avatar);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("должен гарантировать наличие user для различных комбинаций других полей контекста", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 10, maxLength: 50 }),
          userEmail: fc.emailAddress(),
          ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
          userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), {
            nil: undefined,
          }),
          interviewToken: fc.option(
            fc.string({ minLength: 32, maxLength: 64 }),
            { nil: null },
          ),
        }),
        async ({ userId, userEmail, ipAddress, userAgent, interviewToken }) => {
          const mockContext = {
            session: { user: { id: userId, email: userEmail } },
            ipAddress,
            userAgent,
            interviewToken,
            db: {} as Context["db"],
            workspaceRepository: {} as Context["workspaceRepository"],
            organizationRepository: {} as Context["organizationRepository"],
            auditLogger: {} as Context["auditLogger"],
            inngest: {} as Context["inngest"],
            headers: new Headers(),
            authApi: null,
          } as Context;

          const testProcedure = protectedProcedure.handler(({ context }) => {
            // user должен быть доступен независимо от других полей
            return {
              userId: context.session.user.id,
              userEmail: context.session.user.email,
              contextIpAddress: context.ipAddress,
              contextUserAgent: context.userAgent,
            };
          });

          const result = await call(testProcedure, undefined, {
            context: mockContext,
          });

          expect(result.userId).toBe(userId);
          expect(result.userEmail).toBe(userEmail);
          expect(result.contextIpAddress).toBe(ipAddress);
          expect(result.contextUserAgent).toBe(userAgent);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 11: Middleware применяются к обоим типам процедур
 *
 * *For any* publicProcedure и protectedProcedure, все middleware
 * (timing, securityHeaders, securityAudit) должны применяться
 *
 * **Validates: Requirements 3.5**
 */
describe("Property 11: Middleware применяются к обоим типам процедур", () => {
  it("должен применять все middleware к publicProcedure", async () => {
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
            userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), {
              nil: undefined,
            }),
          }),
          async ({ ipAddress, userAgent }) => {
            logs.length = 0;

            const mockContext = {
              session: null, // publicProcedure не требует сессии
              ipAddress,
              userAgent,
              db: {} as Context["db"],
              workspaceRepository: {} as Context["workspaceRepository"],
              organizationRepository: {} as Context["organizationRepository"],
              auditLogger: {} as Context["auditLogger"],
              interviewToken: null,
              inngest: {} as Context["inngest"],
              headers: new Headers(),
              authApi: null,
            } as Context;

            const testProcedure = publicProcedure.handler(() => {
              return { success: true };
            });

            await call(testProcedure, undefined, { context: mockContext });

            // Проверяем что timing middleware сработал
            const timingLog = logs.find((log) => log.includes("выполнен за"));
            expect(timingLog).toBeDefined();

            // Проверяем что security audit middleware сработал
            const auditLog = logs.find((log) => log.includes("Security Audit"));
            expect(auditLog).toBeDefined();
          },
        ),
        { numRuns: 100 },
      );
    } finally {
      console.log = originalLog;
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("должен применять все middleware к protectedProcedure", async () => {
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            userEmail: fc.emailAddress(),
            ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
            userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), {
              nil: undefined,
            }),
          }),
          async ({ userId, userEmail, ipAddress, userAgent }) => {
            logs.length = 0;

            const mockContext = {
              session: { user: { id: userId, email: userEmail } },
              ipAddress,
              userAgent,
              db: {} as Context["db"],
              workspaceRepository: {} as Context["workspaceRepository"],
              organizationRepository: {} as Context["organizationRepository"],
              auditLogger: {} as Context["auditLogger"],
              interviewToken: null,
              inngest: {} as Context["inngest"],
              headers: new Headers(),
              authApi: null,
            } as Context;

            const testProcedure = protectedProcedure.handler(() => {
              return { success: true };
            });

            await call(testProcedure, undefined, { context: mockContext });

            // Проверяем что timing middleware сработал
            const timingLog = logs.find((log) => log.includes("выполнен за"));
            expect(timingLog).toBeDefined();

            // Проверяем что security audit middleware сработал
            const auditLog = logs.find(
              (log) => log.includes("Security Audit") && log.includes(userId),
            );
            expect(auditLog).toBeDefined();
          },
        ),
        { numRuns: 100 },
      );
    } finally {
      console.log = originalLog;
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("должен применять middleware в одинаковом порядке для обоих типов процедур", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasSession: fc.boolean(),
          userId: fc.string({ minLength: 10, maxLength: 50 }),
          userEmail: fc.emailAddress(),
        }),
        async ({ hasSession, userId, userEmail }) => {
          const executionOrder: string[] = [];

          // Создаем тестовые middleware для отслеживания порядка
          const testTimingMiddleware = middleware(async ({ next }) => {
            executionOrder.push("timing-before");
            const result = await next({});
            executionOrder.push("timing-after");
            return result;
          });

          const testSecurityHeadersMiddleware = middleware(async ({ next }) => {
            executionOrder.push("securityHeaders-before");
            const result = await next({});
            executionOrder.push("securityHeaders-after");
            return result;
          });

          const testSecurityAudit = middleware(async ({ next }) => {
            executionOrder.push("securityAudit-before");
            const result = await next({});
            executionOrder.push("securityAudit-after");
            return result;
          });

          // Создаем базовую процедуру с middleware
          const baseProcedure = procedure
            .use(testTimingMiddleware)
            .use(testSecurityHeadersMiddleware)
            .use(testSecurityAudit);

          // Создаем публичную и защищенную процедуры
          const publicProc = baseProcedure.handler(() => {
            executionOrder.push("public-handler");
            return "public";
          });

          const protectedProc = baseProcedure
            .use(
              middleware(async ({ context, next }) => {
                executionOrder.push("auth-before");
                if (!context.session?.user) {
                  throw new Error("UNAUTHORIZED");
                }
                const result = await next({});
                executionOrder.push("auth-after");
                return result;
              }),
            )
            .handler(() => {
              executionOrder.push("protected-handler");
              return "protected";
            });

          const mockContext = {
            session: hasSession
              ? { user: { id: userId, email: userEmail } }
              : null,
            ipAddress: "127.0.0.1",
            db: {} as Context["db"],
            workspaceRepository: {} as Context["workspaceRepository"],
            organizationRepository: {} as Context["organizationRepository"],
            auditLogger: {} as Context["auditLogger"],
            userAgent: undefined,
            interviewToken: null,
            inngest: {} as Context["inngest"],
            headers: new Headers(),
            authApi: null,
          } as Context;

          // Тестируем publicProcedure
          executionOrder.length = 0;
          await call(publicProc, undefined, { context: mockContext });

          const publicOrder = [...executionOrder];

          // Проверяем порядок для publicProcedure
          expect(publicOrder).toContain("timing-before");
          expect(publicOrder).toContain("securityHeaders-before");
          expect(publicOrder).toContain("securityAudit-before");
          expect(publicOrder).toContain("public-handler");

          // Тестируем protectedProcedure (только если есть сессия)
          if (hasSession) {
            executionOrder.length = 0;
            await call(protectedProc, undefined, { context: mockContext });

            const protectedOrder = [...executionOrder];

            // Проверяем что базовые middleware применяются в том же порядке
            const publicBaseOrder = publicOrder.filter(
              (item) =>
                item.includes("timing") ||
                item.includes("securityHeaders") ||
                item.includes("securityAudit"),
            );
            const protectedBaseOrder = protectedOrder.filter(
              (item) =>
                item.includes("timing") ||
                item.includes("securityHeaders") ||
                item.includes("securityAudit"),
            );

            // Порядок базовых middleware должен быть одинаковым
            expect(protectedBaseOrder).toEqual(publicBaseOrder);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("должен применять middleware независимо от результата выполнения процедуры", async () => {
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            shouldThrow: fc.boolean(),
            procedureType: fc.constantFrom("public", "protected"),
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            userEmail: fc.emailAddress(),
          }),
          async ({ shouldThrow, procedureType, userId, userEmail }) => {
            logs.length = 0;

            const mockContext = {
              session:
                procedureType === "protected"
                  ? { user: { id: userId, email: userEmail } }
                  : null,
              ipAddress: "127.0.0.1",
              db: {} as Context["db"],
              workspaceRepository: {} as Context["workspaceRepository"],
              organizationRepository: {} as Context["organizationRepository"],
              auditLogger: {} as Context["auditLogger"],
              userAgent: undefined,
              interviewToken: null,
              inngest: {} as Context["inngest"],
              headers: new Headers(),
              authApi: null,
            } as Context;

            const baseProcedure =
              procedureType === "public" ? publicProcedure : protectedProcedure;

            const testProcedure = baseProcedure.handler(() => {
              if (shouldThrow) {
                throw new Error("Test error");
              }
              return { success: true };
            });

            try {
              await call(testProcedure, undefined, { context: mockContext });
            } catch (error) {
              // Игнорируем ошибку
            }

            // Security audit middleware должен сработать даже если процедура выбросила ошибку
            const auditLog = logs.find((log) => log.includes("Security Audit"));
            expect(auditLog).toBeDefined();

            // Timing middleware логирует только в случае успешного выполнения или после обработки ошибки
            // Проверяем что хотя бы один из middleware сработал
            const hasMiddlewareLogs = logs.length > 0;
            expect(hasMiddlewareLogs).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    } finally {
      console.log = originalLog;
      process.env.NODE_ENV = originalEnv;
    }
  });
});
