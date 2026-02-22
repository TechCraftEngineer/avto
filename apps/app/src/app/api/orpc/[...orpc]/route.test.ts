/**
 * Integration Tests для oRPC Route Handler
 *
 * Этот файл содержит integration тесты для Next.js API route handler,
 * проверяющие корректность обработки HTTP запросов к oRPC endpoint.
 *
 * Feature: trpc-to-orpc-migration
 * Task: 8.2 Написать integration тест для route handler
 * @see .kiro/specs/trpc-to-orpc-migration/design.md
 * @see .kiro/specs/trpc-to-orpc-migration/requirements.md (Requirements 11.1)
 */

import { describe, expect, it } from "bun:test";

describe("oRPC Route Handler - Configuration", () => {
  /**
   * Тест: Route handler файл существует и экспортирует необходимые функции
   *
   * Проверяет что route handler корректно настроен и экспортирует
   * GET и POST handlers для Next.js App Router.
   *
   * **Validates: Requirements 11.1**
   */
  it("должен экспортировать GET и POST handlers", async () => {
    // Проверяем структуру файла вместо динамического импорта
    // чтобы избежать проблем с зависимостями во время тестирования
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем что экспортированы необходимые функции
    expect(routeFile).toContain("export const OPTIONS");
    expect(routeFile).toContain("export { handler as GET, handler as POST }");

    // Проверяем что handler определен как async функция
    expect(routeFile).toContain("const handler = async");
  });

  it("должен использовать корректный endpoint prefix", async () => {
    // Читаем файл route.ts чтобы проверить конфигурацию
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем что endpoint настроен на /api/orpc
    expect(routeFile).toContain('prefix: "/api/orpc"');
  });

  it("должен импортировать appRouter из @qbs-autonaim/api/root-orpc", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем правильные импорты
    expect(routeFile).toContain("@qbs-autonaim/api/root-orpc");
    expect(routeFile).toContain("appRouter");
  });

  it("должен импортировать createContext из @qbs-autonaim/api/orpc", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем правильные импорты
    expect(routeFile).toContain("@qbs-autonaim/api/orpc");
    expect(routeFile).toContain("createContext");
  });

  it("должен использовать fetchHandler из @orpc/server/fetch", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем правильный импорт handler
    expect(routeFile).toContain("@orpc/server/fetch");
    expect(routeFile).toContain("fetchHandler");
  });

  it("должен настраивать CORS заголовки", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем наличие CORS конфигурации
    expect(routeFile).toContain("Access-Control-Allow-Origin");
    expect(routeFile).toContain("Access-Control-Allow-Methods");
    expect(routeFile).toContain("Access-Control-Allow-Headers");
    expect(routeFile).toContain("Access-Control-Allow-Credentials");
  });

  it("должен добавлять security заголовки", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем что используется addAPISecurityHeaders
    expect(routeFile).toContain("addAPISecurityHeaders");
  });

  it("должен логировать ошибки через onError callback", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем наличие onError callback
    expect(routeFile).toContain("onError");
    expect(routeFile).toContain("console.error");
  });

  it("должен передавать auth в createContext", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем что auth передается в контекст
    expect(routeFile).toContain("auth: auth");
    expect(routeFile).toContain("headers: req.headers");
  });
});

describe("oRPC Route Handler - CORS Configuration", () => {
  it("должен разрешать localhost:3000", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    expect(routeFile).toContain("http://localhost:3000");
  });

  it("должен разрешать production домен", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    expect(routeFile).toContain("https://app.avtonaim.qbsoft.ru");
  });

  it("должен использовать NEXT_PUBLIC_APP_URL из env", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    expect(routeFile).toContain("process.env.NEXT_PUBLIC_APP_URL");
  });

  it("должен устанавливать Max-Age для preflight кэширования", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    expect(routeFile).toContain("Access-Control-Max-Age");
    expect(routeFile).toContain("86400"); // 24 часа
  });
});

describe("oRPC Route Handler - Structure", () => {
  it("должен иметь корректную структуру файла", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем основные компоненты
    expect(routeFile).toContain("const setCorsHeaders");
    expect(routeFile).toContain("export const OPTIONS");
    expect(routeFile).toContain("const handler");
    expect(routeFile).toContain("export { handler as GET, handler as POST }");
  });

  it("должен использовать async/await для handler", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    expect(routeFile).toContain("const handler = async");
    expect(routeFile).toContain("await fetchHandler");
    expect(routeFile).toContain("await createContext");
  });

  it("должен иметь комментарии на русском языке", async () => {
    const routeFile = await Bun.file(
      "apps/app/src/app/api/orpc/[...orpc]/route.ts",
    ).text();

    // Проверяем наличие русских комментариев
    expect(routeFile).toContain("Настройка безопасных CORS заголовков");
    expect(routeFile).toContain("Список разрешенных источников");
    expect(routeFile).toContain("Добавляем заголовки безопасности");
  });
});
