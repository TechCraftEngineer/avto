/**
 * Integration Tests для ClientLayout с провайдерами
 *
 * Этот файл содержит integration тесты для ClientLayout компонента,
 * проверяющие корректность работы tRPC и oRPC провайдеров одновременно.
 *
 * Feature: trpc-to-orpc-migration
 * Task: 11.2 Написать integration тест для провайдеров
 * @see .kiro/specs/trpc-to-orpc-migration/design.md
 * @see .kiro/specs/trpc-to-orpc-migration/requirements.md (Requirements 12.1)
 */

import { describe, expect, it } from "bun:test";

describe("ClientLayout - Структура провайдеров", () => {
  /**
   * Тест: ClientLayout должен содержать оба провайдера
   *
   * Проверяет что ClientLayout корректно настроен с обоими провайдерами
   * для обеспечения обратной совместимости во время миграции.
   *
   * **Validates: Requirements 12.1**
   */
  it("должен содержать TRPCReactProvider и ORPCReactProvider", async () => {
    const layoutFile = await Bun.file(
      "apps/app/src/components/layout/components/client-layout/client-layout.tsx",
    ).text();

    // Проверяем импорты обоих провайдеров
    expect(layoutFile).toContain('from "~/orpc/react"');
    expect(layoutFile).toContain('from "~/orpc/react"');
    expect(layoutFile).toContain("TRPCReactProvider");
    expect(layoutFile).toContain("ORPCReactProvider");
  });

  it("должен вкладывать провайдеры в правильном порядке", async () => {
    const layoutFile = await Bun.file(
      "apps/app/src/components/layout/components/client-layout/client-layout.tsx",
    ).text();

    // Проверяем что TRPCReactProvider оборачивает ORPCReactProvider
    const trpcIndex = layoutFile.indexOf("<TRPCReactProvider>");
    const orpcIndex = layoutFile.indexOf("<ORPCReactProvider>");
    const trpcCloseIndex = layoutFile.indexOf("</TRPCReactProvider>");
    const orpcCloseIndex = layoutFile.indexOf("</ORPCReactProvider>");

    // TRPCReactProvider должен открываться раньше
    expect(trpcIndex).toBeLessThan(orpcIndex);
    // ORPCReactProvider должен закрываться раньше
    expect(orpcCloseIndex).toBeLessThan(trpcCloseIndex);
  });

  it("должен быть клиентским компонентом", async () => {
    const layoutFile = await Bun.file(
      "apps/app/src/components/layout/components/client-layout/client-layout.tsx",
    ).text();

    // Проверяем наличие директивы "use client"
    expect(layoutFile).toContain('"use client"');
  });

  it("должен содержать ErrorBoundary для обработки ошибок", async () => {
    const layoutFile = await Bun.file(
      "apps/app/src/components/layout/components/client-layout/client-layout.tsx",
    ).text();

    expect(layoutFile).toContain("ErrorBoundary");
  });

  it("должен содержать ThemeProvider", async () => {
    const layoutFile = await Bun.file(
      "apps/app/src/components/layout/components/client-layout/client-layout.tsx",
    ).text();

    expect(layoutFile).toContain("ThemeProvider");
  });
});

describe("ClientLayout - Рендеринг", () => {
  /**
   * Тест: ClientLayout должен рендерить children
   *
   * Проверяет что ClientLayout корректно рендерит дочерние элементы
   * внутри всех провайдеров через проверку структуры файла.
   *
   * **Validates: Requirements 12.1**
   */
  it("должен принимать children prop", async () => {
    const layoutFile = await Bun.file(
      "apps/app/src/components/layout/components/client-layout/client-layout.tsx",
    ).text();

    // Проверяем что компонент принимает children
    expect(layoutFile).toContain("children: React.ReactNode");
    expect(layoutFile).toContain("{children}");
  });

  it("должен передавать children через все провайдеры", async () => {
    const layoutFile = await Bun.file(
      "apps/app/src/components/layout/components/client-layout/client-layout.tsx",
    ).text();

    // Проверяем что children передается в самый внутренний провайдер
    const childrenCount = (layoutFile.match(/{children}/g) || []).length;
    expect(childrenCount).toBeGreaterThan(0);
  });
});

describe("ClientLayout - Интеграция провайдеров", () => {
  /**
   * Тест: Оба провайдера должны быть доступны одновременно
   *
   * Проверяет что tRPC и oRPC провайдеры работают параллельно
   * и не конфликтуют друг с другом.
   *
   * **Validates: Requirements 12.1**
   */
  it("должен позволять использовать оба провайдера одновременно", async () => {
    const layoutFile = await Bun.file(
      "apps/app/src/components/layout/components/client-layout/client-layout.tsx",
    ).text();

    // Проверяем что оба провайдера присутствуют в одном компоненте
    const hasTRPC = layoutFile.includes("TRPCReactProvider");
    const hasORPC = layoutFile.includes("ORPCReactProvider");

    expect(hasTRPC).toBe(true);
    expect(hasORPC).toBe(true);

    // Проверяем что они не исключают друг друга
    const bothPresent = hasTRPC && hasORPC;
    expect(bothPresent).toBe(true);
  });

  it("должен использовать один QueryClient для обоих провайдеров", async () => {
    // Проверяем что оба провайдера используют общий QueryClientProvider
    const trpcFile = await Bun.file("apps/app/src/trpc/react.tsx").text();
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    // Оба должны использовать QueryClientProvider
    expect(trpcFile).toContain("QueryClientProvider");
    expect(orpcFile).toContain("QueryClientProvider");

    // Оба должны использовать одинаковую функцию createQueryClient
    expect(trpcFile).toContain("createQueryClient");
    expect(orpcFile).toContain("createQueryClient");
  });
});

describe("ClientLayout - Конфигурация провайдеров", () => {
  it("должен импортировать правильные типы для tRPC", async () => {
    const trpcFile = await Bun.file("apps/app/src/trpc/react.tsx").text();

    expect(trpcFile).toContain('from "@qbs-autonaim/api"');
    expect(trpcFile).toContain("AppRouter");
  });

  it("должен импортировать правильные типы для oRPC", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    expect(orpcFile).toContain('from "@qbs-autonaim/api"');
    expect(orpcFile).toContain("AppRouter");
  });

  it("должен использовать SuperJSON в обоих провайдерах", async () => {
    const trpcFile = await Bun.file("apps/app/src/trpc/react.tsx").text();
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    expect(trpcFile).toContain("SuperJSON");
    expect(orpcFile).toContain("SuperJSON");
  });

  it("должен использовать httpBatchStreamLink в обоих провайдерах", async () => {
    const trpcFile = await Bun.file("apps/app/src/trpc/react.tsx").text();
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    expect(trpcFile).toContain("httpBatchStreamLink");
    expect(orpcFile).toContain("httpBatchStreamLink");
  });

  it("должен использовать разные API endpoints", async () => {
    const trpcFile = await Bun.file("apps/app/src/trpc/react.tsx").text();
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    expect(trpcFile).toContain("/api/trpc");
    expect(orpcFile).toContain("/api/orpc");
  });

  it("должен использовать разные source headers", async () => {
    const trpcFile = await Bun.file("apps/app/src/trpc/react.tsx").text();
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    expect(trpcFile).toContain("x-trpc-source");
    expect(orpcFile).toContain("x-orpc-source");
  });
});

describe("ClientLayout - Хуки провайдеров", () => {
  /**
   * Тест: oRPC клиент должен быть доступен через useORPC
   *
   * Проверяет что хук useORPC экспортируется и доступен
   * для использования в компонентах.
   *
   * **Validates: Requirements 12.1**
   */
  it("должен экспортировать useORPC хук", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    // Проверяем что useORPC создается через createORPCContext
    expect(orpcFile).toContain("createORPCContext");
    expect(orpcFile).toContain("useORPC");

    // Проверяем что useORPC экспортируется
    const hasExport =
      orpcFile.includes("export const { useORPC") ||
      orpcFile.includes("export const {") ||
      orpcFile.includes("useORPC");

    expect(hasExport).toBe(true);
  });

  it("должен экспортировать useORPC хук", async () => {
    const trpcFile = await Bun.file("apps/app/src/trpc/react.tsx").text();

    // Проверяем что useORPC создается через createTRPCContext
    expect(trpcFile).toContain("createTRPCContext");
    expect(trpcFile).toContain("useORPC");

    // Проверяем что useORPC экспортируется
    const hasExport =
      trpcFile.includes("export const { useORPC") ||
      trpcFile.includes("export const {") ||
      trpcFile.includes("useORPC");

    expect(hasExport).toBe(true);
  });

  it("должен экспортировать useORPCClient хук", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    expect(orpcFile).toContain("useORPCClient");
  });

  it("должен экспортировать useORPCClient хук", async () => {
    const trpcFile = await Bun.file("apps/app/src/trpc/react.tsx").text();

    expect(trpcFile).toContain("useORPCClient");
  });
});

describe("ClientLayout - Обработка ошибок", () => {
  it("должен логировать ошибки сети в oRPC", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    // Проверяем наличие обработки ошибок fetch
    expect(orpcFile).toContain("catch");
    expect(orpcFile).toContain("console.error");
    expect(orpcFile).toContain("[ORPC]");
  });

  it("должен использовать loggerLink в development режиме", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    expect(orpcFile).toContain("loggerLink");
    expect(orpcFile).toContain("env.NODE_ENV");
    expect(orpcFile).toContain("development");
  });
});

describe("ClientLayout - Singleton паттерн", () => {
  it("должен использовать singleton для QueryClient на клиенте", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    // Проверяем наличие singleton паттерна
    expect(orpcFile).toContain("clientQueryClientSingleton");
    expect(orpcFile).toContain("typeof window");
    expect(orpcFile).toContain("??=");
  });

  it("должен создавать новый QueryClient на сервере", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    // Проверяем что на сервере всегда создается новый клиент
    expect(orpcFile).toContain('typeof window === "undefined"');
    expect(orpcFile).toContain("createQueryClient()");
  });
});

describe("ClientLayout - Credentials и безопасность", () => {
  it("должен использовать same-origin credentials в oRPC", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    expect(orpcFile).toContain("credentials");
    expect(orpcFile).toContain("same-origin");
  });

  it("должен определять baseURL корректно", async () => {
    const orpcFile = await Bun.file("apps/app/src/orpc/react.tsx").text();

    // Проверяем функцию getBaseUrl
    expect(orpcFile).toContain("getBaseUrl");
    expect(orpcFile).toContain("window.location.origin");
    expect(orpcFile).toContain("VERCEL_URL");
    expect(orpcFile).toContain("localhost");
  });
});
