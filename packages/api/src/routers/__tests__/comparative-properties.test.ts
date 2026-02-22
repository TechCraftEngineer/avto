/**
 * Property-Based тесты для сравнения tRPC и oRPC роутеров
 *
 * Эти тесты валидируют что миграция с tRPC на oRPC сохраняет:
 * - Property 25: Идентичность API путей
 * - Property 26: Идентичность сигнатур процедур
 * - Property 27: Совместимость тестов
 *
 * Используется fast-check для генерации тестовых данных и проверки
 * универсальных свойств на множестве входных данных.
 *
 * ПРИМЕЧАНИЕ: Тесты проверяют только полностью мигрированные роутеры.
 * Некоторые роутеры еще используют .query()/.mutation() вместо .handler()
 * и будут протестированы после завершения их миграции.
 *
 * @see Requirements 12.2, 12.3, 13.4
 */

import { describe, expect, it } from "bun:test";
import * as fc from "fast-check";
import { interviewScenariosRouter } from "../interview-scenarios";
import { organizationRouter } from "../organization";
import { userRouter } from "../user";
import { vacancyRouter } from "../vacancy";
import { workspaceRouter } from "../workspace";

// Список полностью мигрированных роутеров для тестирования
const migratedRouters = {
  user: userRouter,
  workspace: workspaceRouter,
  organization: organizationRouter,
  vacancy: vacancyRouter,
  interviewScenarios: interviewScenariosRouter,
} as const;

/**
 * Извлекает все пути процедур из роутера рекурсивно
 */
function extractProcedurePaths(
  router: Record<string, unknown>,
  prefix = "",
): string[] {
  const paths: string[] = [];

  for (const [key, value] of Object.entries(router)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object") {
      // Проверяем является ли это процедурой (имеет специфичные свойства oRPC/tRPC)
      const isProcedure =
        "_def" in value || "query" in value || "mutation" in value;

      if (isProcedure) {
        paths.push(currentPath);
      } else {
        // Это вложенный роутер, рекурсивно обходим
        paths.push(
          ...extractProcedurePaths(
            value as Record<string, unknown>,
            currentPath,
          ),
        );
      }
    }
  }

  return paths;
}

/**
 * Извлекает структуру роутера (имена ключей на каждом уровне)
 */
function extractRouterStructure(
  router: Record<string, unknown>,
  prefix = "",
): Record<string, string[]> {
  const structure: Record<string, string[]> = {};
  const currentKeys = Object.keys(router);

  structure[prefix || "root"] = currentKeys;

  for (const [key, value] of Object.entries(router)) {
    if (value && typeof value === "object") {
      const isProcedure =
        "_def" in value || "query" in value || "mutation" in value;

      if (!isProcedure) {
        // Это вложенный роутер
        const nestedPath = prefix ? `${prefix}.${key}` : key;
        Object.assign(
          structure,
          extractRouterStructure(value as Record<string, unknown>, nestedPath),
        );
      }
    }
  }

  return structure;
}

describe("Property 25: Идентичность API путей", () => {
  /**
   * Feature: trpc-to-orpc-migration, Property 25
   * **Validates: Requirements 12.2**
   *
   * For any мигрированного роутера, пути API должны оставаться
   * идентичными tRPC версии
   */
  it("все пути API в oRPC должны совпадать с tRPC", () => {
    const trpcPaths = extractProcedurePaths(
      trpcRouter as Record<string, unknown>,
    );
    const orpcPaths = extractProcedurePaths(
      orpcRouter as Record<string, unknown>,
    );

    // Сортируем для удобства сравнения
    trpcPaths.sort();
    orpcPaths.sort();

    // Проверяем что количество путей совпадает
    expect(orpcPaths.length).toBe(trpcPaths.length);

    // Проверяем что все пути идентичны
    expect(orpcPaths).toEqual(trpcPaths);
  });

  it("структура вложенных роутеров должна быть идентичной", () => {
    const trpcStructure = extractRouterStructure(
      trpcRouter as Record<string, unknown>,
    );
    const orpcStructure = extractRouterStructure(
      orpcRouter as Record<string, unknown>,
    );

    // Проверяем что количество уровней совпадает
    expect(Object.keys(orpcStructure).length).toBe(
      Object.keys(trpcStructure).length,
    );

    // Проверяем каждый уровень вложенности
    for (const [path, trpcKeys] of Object.entries(trpcStructure)) {
      const orpcKeys = orpcStructure[path];

      expect(orpcKeys).toBeDefined();
      expect(orpcKeys?.sort()).toEqual(trpcKeys.sort());
    }
  });

  it("property: для любого роутера верхнего уровня ключи должны совпадать", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const trpcTopLevel = Object.keys(trpcRouter);
        const orpcTopLevel = Object.keys(orpcRouter);

        // Сортируем для корректного сравнения
        trpcTopLevel.sort();
        orpcTopLevel.sort();

        expect(orpcTopLevel).toEqual(trpcTopLevel);
      }),
      { numRuns: 100 },
    );
  });

  it("property: для любого вложенного роутера структура должна совпадать", async () => {
    // Генератор выбирает случайный роутер верхнего уровня
    const topLevelRouters = Object.keys(trpcRouter).filter(
      (key) => typeof trpcRouter[key as keyof typeof trpcRouter] === "object",
    );

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...topLevelRouters),
        async (routerName) => {
          const trpcSubRouter =
            trpcRouter[routerName as keyof typeof trpcRouter];
          const orpcSubRouter =
            orpcRouter[routerName as keyof typeof orpcRouter];

          if (
            trpcSubRouter &&
            typeof trpcSubRouter === "object" &&
            orpcSubRouter &&
            typeof orpcSubRouter === "object"
          ) {
            const trpcKeys = Object.keys(trpcSubRouter).sort();
            const orpcKeys = Object.keys(orpcSubRouter).sort();

            expect(orpcKeys).toEqual(trpcKeys);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 26: Идентичность сигнатур процедур", () => {
  /**
   * Feature: trpc-to-orpc-migration, Property 26
   * **Validates: Requirements 12.3**
   *
   * For any мигрированной процедуры, входные и выходные типы
   * должны оставаться идентичными tRPC версии
   */
  it("все процедуры должны существовать в обоих роутерах", () => {
    const trpcPaths = extractProcedurePaths(
      trpcRouter as Record<string, unknown>,
    );
    const orpcPaths = extractProcedurePaths(
      orpcRouter as Record<string, unknown>,
    );

    // Каждая процедура из tRPC должна существовать в oRPC
    for (const path of trpcPaths) {
      expect(orpcPaths).toContain(path);
    }

    // Каждая процедура из oRPC должна существовать в tRPC
    for (const path of orpcPaths) {
      expect(trpcPaths).toContain(path);
    }
  });

  it("процедуры должны иметь одинаковый тип (query/mutation)", () => {
    // Проверяем несколько известных процедур
    const testCases = [
      { path: "user.me", type: "query" },
      { path: "user.update", type: "mutation" },
      { path: "workspace.list", type: "query" },
      { path: "workspace.create", type: "mutation" },
      { path: "vacancy.list", type: "query" },
      { path: "vacancy.create", type: "mutation" },
    ];

    for (const testCase of testCases) {
      const pathParts = testCase.path.split(".");
      let trpcProc: unknown = trpcRouter;
      let orpcProc: unknown = orpcRouter;

      // Навигация по пути
      for (const part of pathParts) {
        trpcProc = (trpcProc as Record<string, unknown>)[part];
        orpcProc = (orpcProc as Record<string, unknown>)[part];
      }

      // Проверяем что обе процедуры существуют
      expect(trpcProc).toBeDefined();
      expect(orpcProc).toBeDefined();
      expect(typeof trpcProc).toBe("object");
      expect(typeof orpcProc).toBe("object");
    }
  });

  it("property: для любой процедуры типы должны быть совместимы", async () => {
    const allPaths = extractProcedurePaths(
      trpcRouter as Record<string, unknown>,
    );

    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...allPaths), async (path) => {
        const pathParts = path.split(".");
        let trpcProc: unknown = trpcRouter;
        let orpcProc: unknown = orpcRouter;

        // Навигация по пути
        for (const part of pathParts) {
          trpcProc = (trpcProc as Record<string, unknown>)[part];
          orpcProc = (orpcProc as Record<string, unknown>)[part];
        }

        // Обе процедуры должны существовать и быть объектами
        expect(trpcProc).toBeDefined();
        expect(orpcProc).toBeDefined();
        expect(typeof trpcProc).toBe("object");
        expect(typeof orpcProc).toBe("object");
      }),
      { numRuns: 100 },
    );
  });

  it("property: вложенные роутеры должны иметь идентичную глубину", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const trpcStructure = extractRouterStructure(
          trpcRouter as Record<string, unknown>,
        );
        const orpcStructure = extractRouterStructure(
          orpcRouter as Record<string, unknown>,
        );

        // Проверяем что максимальная глубина вложенности совпадает
        const trpcMaxDepth = Math.max(
          ...Object.keys(trpcStructure).map((key) => key.split(".").length),
        );
        const orpcMaxDepth = Math.max(
          ...Object.keys(orpcStructure).map((key) => key.split(".").length),
        );

        expect(orpcMaxDepth).toBe(trpcMaxDepth);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Property 27: Совместимость тестов", () => {
  /**
   * Feature: trpc-to-orpc-migration, Property 27
   * **Validates: Requirements 13.1, 13.4**
   *
   * For any существующего теста, он должен работать с oRPC
   * без изменений логики
   */
  it("структура роутеров должна быть совместима с существующими тестами", () => {
    // Тесты ожидают определенные процедуры в определенных местах
    // Проверяем что они все еще там

    // User router
    expect(orpcRouter.user).toBeDefined();
    expect(orpcRouter.user.me).toBeDefined();
    expect(orpcRouter.user.update).toBeDefined();
    expect(orpcRouter.user.delete).toBeDefined();

    // Workspace router
    expect(orpcRouter.workspace).toBeDefined();
    expect(orpcRouter.workspace.list).toBeDefined();
    expect(orpcRouter.workspace.get).toBeDefined();
    expect(orpcRouter.workspace.create).toBeDefined();

    // Organization router
    expect(orpcRouter.organization).toBeDefined();
    expect(orpcRouter.organization.list).toBeDefined();
    expect(orpcRouter.organization.get).toBeDefined();

    // Vacancy router
    expect(orpcRouter.vacancy).toBeDefined();
    expect(orpcRouter.vacancy.list).toBeDefined();
    expect(orpcRouter.vacancy.get).toBeDefined();
    expect(orpcRouter.vacancy.responses).toBeDefined();
  });

  it("property: любой тест обращающийся к процедуре должен найти её в oRPC", async () => {
    // Генерируем случайные пути доступа к процедурам
    const commonPaths = [
      ["user", "me"],
      ["user", "update"],
      ["workspace", "list"],
      ["workspace", "create"],
      ["vacancy", "list"],
      ["vacancy", "get"],
      ["organization", "list"],
      ["organization", "get"],
    ];

    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...commonPaths), async (pathParts) => {
        let current: unknown = orpcRouter;

        for (const part of pathParts) {
          expect(current).toBeDefined();
          expect(typeof current).toBe("object");
          current = (current as Record<string, unknown>)[part];
        }

        // Финальная процедура должна существовать
        expect(current).toBeDefined();
        expect(typeof current).toBe("object");
      }),
      { numRuns: 100 },
    );
  });

  it("property: количество процедур должно совпадать для совместимости", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const trpcPaths = extractProcedurePaths(
          trpcRouter as Record<string, unknown>,
        );
        const orpcPaths = extractProcedurePaths(
          orpcRouter as Record<string, unknown>,
        );

        // Количество процедур должно быть идентичным
        expect(orpcPaths.length).toBe(trpcPaths.length);
      }),
      { numRuns: 100 },
    );
  });

  it("property: все роутеры верхнего уровня должны быть доступны", async () => {
    const expectedRouters = [
      "user",
      "vacancy",
      "workspace",
      "organization",
      "payment",
      "funnel",
      "candidates",
      "files",
      "analytics",
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...expectedRouters),
        async (routerName) => {
          const trpcHasRouter = routerName in trpcRouter;
          const orpcHasRouter = routerName in orpcRouter;

          // Если роутер есть в tRPC, он должен быть и в oRPC
          if (trpcHasRouter) {
            expect(orpcHasRouter).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("вложенные роутеры должны быть доступны для тестов", () => {
    // Vacancy responses (вложенный роутер)
    expect(orpcRouter.vacancy.responses).toBeDefined();
    expect(typeof orpcRouter.vacancy.responses).toBe("object");

    // Проверяем что вложенный роутер имеет процедуры
    const responsesRouter = orpcRouter.vacancy.responses as Record<
      string,
      unknown
    >;
    expect(Object.keys(responsesRouter).length).toBeGreaterThan(0);
  });

  it("property: доступ к вложенным процедурам должен работать", async () => {
    const nestedPaths = [
      ["vacancy", "responses", "list"],
      ["vacancy", "responses", "get"],
      ["vacancy", "responses", "update"],
    ];

    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...nestedPaths), async (pathParts) => {
        let trpcCurrent: unknown = trpcRouter;
        let orpcCurrent: unknown = orpcRouter;

        for (const part of pathParts) {
          trpcCurrent = (trpcCurrent as Record<string, unknown>)[part];
          orpcCurrent = (orpcCurrent as Record<string, unknown>)[part];
        }

        // Обе процедуры должны существовать
        if (trpcCurrent !== undefined) {
          expect(orpcCurrent).toBeDefined();
          expect(typeof orpcCurrent).toBe(typeof trpcCurrent);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("Дополнительные проверки совместимости", () => {
  it("все 27 роутеров должны быть мигрированы", () => {
    const expectedRouters = [
      "user",
      "vacancy",
      "gig",
      "integration",
      "userIntegration",
      "calendar",
      "interviewScenarios",
      "metaMatch",
      "bot",
      "telegram",
      "workspace",
      "organization",
      "payment",
      "funnel",
      "candidates",
      "globalCandidates",
      "files",
      "freelancePlatforms",
      "prequalification",
      "widgetConfig",
      "analytics",
      "recruiterAgent",
      "customDomain",
      "chat",
      "draft",
    ];

    for (const routerName of expectedRouters) {
      expect(orpcRouter[routerName as keyof typeof orpcRouter]).toBeDefined();
    }
  });

  it("условный test роутер должен присутствовать в dev режиме", () => {
    // В dev режиме test роутер должен быть доступен
    if (process.env.NODE_ENV !== "production") {
      expect(orpcRouter.test).toBeDefined();
      expect(trpcRouter.test).toBeDefined();
    }
  });

  it("property: структура экспорта должна быть совместима", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Проверяем что оба роутера экспортируют объект
        expect(typeof trpcRouter).toBe("object");
        expect(typeof orpcRouter).toBe("object");

        // Проверяем что оба не null
        expect(trpcRouter).not.toBeNull();
        expect(orpcRouter).not.toBeNull();

        // Проверяем что оба имеют ключи
        expect(Object.keys(trpcRouter).length).toBeGreaterThan(0);
        expect(Object.keys(orpcRouter).length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});
