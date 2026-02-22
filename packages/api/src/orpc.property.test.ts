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
import * as fc from "fast-check";
import { createContext } from "./orpc";

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
        expect(ctx.db).toBeDefined();
        expect(ctx.workspaceRepository).toBeDefined();
        expect(ctx.organizationRepository).toBeDefined();
        expect(ctx.auditLogger).toBeDefined();
        expect(ctx.inngest).toBeDefined();
        expect(ctx.headers).toBeInstanceOf(Headers);

        // Проверяем что ipAddress извлекается корректно
        if (headersObj["x-forwarded-for"]) {
          expect(ctx.ipAddress).toBe(headersObj["x-forwarded-for"]);
        } else if (headersObj["x-real-ip"]) {
          expect(ctx.ipAddress).toBe(headersObj["x-real-ip"]);
        } else {
          expect(ctx.ipAddress).toBeUndefined();
        }

        // Проверяем что userAgent извлекается корректно
        if (headersObj["user-agent"]) {
          // Headers API trims leading/trailing whitespace from values
          const normalizedUserAgent = headers.get("user-agent");
          expect(ctx.userAgent).toBe(normalizedUserAgent);
        } else {
          expect(ctx.userAgent).toBeUndefined();
        }

        // Проверяем что headers сохраняются
        expect(ctx.headers).toBe(headers);
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
        expect(ctx.ipAddress).toBe(forwardedFor);
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

        expect(ctx.ipAddress).toBe(realIp);
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

          expect(ctx.ipAddress).toBeUndefined();
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
        expect(ctx.userAgent).toBe(headers.get("user-agent"));
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
            expect(ctx.headers.get(key.toLowerCase())).toBe(normalizedValue);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
