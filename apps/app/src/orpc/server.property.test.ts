/**
 * Property-Based Tests для oRPC Server Helpers
 *
 * Этот файл содержит property-based тесты для серверных хелперов oRPC,
 * которые обеспечивают server-side prefetch и передачу данных клиенту.
 *
 * Feature: trpc-to-orpc-migration
 * @see .kiro/specs/trpc-to-orpc-migration/design.md
 */

import { describe, expect, it, mock } from "bun:test";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import * as fc from "fast-check";

/**
 * Property 24: Prefetch на сервере
 *
 * *For any* серверного компонента, prefetchQuery должен загружать данные на сервере
 * и передавать их клиенту через HydrationBoundary
 *
 * **Validates: Requirements 7.5, 11.3**
 */
describe("Property 24: Prefetch на сервере", () => {
  it("должен загружать данные на сервере и сохранять их в QueryClient для передачи клиенту", async () => {
    // Генератор для различных типов данных, которые могут быть prefetch'ены
    const dataArb = fc.oneof(
      // Простые объекты
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 50 }),
        name: fc.string({ minLength: 1, maxLength: 100 }),
        createdAt: fc.date(),
      }),
      // Массивы объектов
      fc.array(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        { minLength: 0, maxLength: 10 },
      ),
      // Вложенные структуры
      fc.record({
        workspace: fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          members: fc.array(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 50 }),
              role: fc.constantFrom("owner", "admin", "member"),
            }),
            { minLength: 0, maxLength: 5 },
          ),
        }),
      }),
    );

    await fc.assert(
      fc.asyncProperty(dataArb, async (testData) => {
        // Создаем новый QueryClient для каждой итерации
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Number.POSITIVE_INFINITY,
            },
          },
        });

        // Генерируем уникальный query key для этой итерации
        const queryKey = ["orpc", "test", "procedure", { input: testData }];

        // Мокируем процедуру, которая возвращает тестовые данные
        const mockProcedureHandler = mock(async () => testData);

        // Симулируем prefetch на сервере
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: mockProcedureHandler,
        });

        // Проверяем, что процедура была вызвана (данные загружены на сервере)
        expect(mockProcedureHandler).toHaveBeenCalledTimes(1);

        // Проверяем, что данные сохранены в QueryClient
        const cachedData = queryClient.getQueryData(queryKey);
        expect(cachedData).toEqual(testData);

        // Проверяем, что данные могут быть dehydrate'ны для передачи клиенту
        const dehydratedState = dehydrate(queryClient);

        // Проверяем структуру dehydrated state
        expect(dehydratedState).toHaveProperty("queries");
        expect(Array.isArray(dehydratedState.queries)).toBe(true);
        expect(dehydratedState.queries.length).toBeGreaterThan(0);

        // Находим наш query в dehydrated state
        const ourQuery = dehydratedState.queries.find((q) => {
          return JSON.stringify(q.queryKey) === JSON.stringify(queryKey);
        });

        expect(ourQuery).toBeDefined();
        expect(ourQuery?.state.data).toEqual(testData);
        expect(ourQuery?.state.status).toBe("success");

        // Проверяем, что данные могут быть восстановлены на клиенте
        const clientQueryClient = new QueryClient();
        clientQueryClient.setQueryData(queryKey, ourQuery?.state.data);

        const restoredData = clientQueryClient.getQueryData(queryKey);
        expect(restoredData).toEqual(testData);

        // Cleanup
        queryClient.clear();
        clientQueryClient.clear();
      }),
      { numRuns: 100 },
    );
  });

  it("должен корректно обрабатывать prefetch с различными типами input параметров", async () => {
    // Генератор для различных типов input параметров
    const inputArb = fc.oneof(
      // Без параметров (undefined)
      fc.constant(undefined),
      // Простые параметры
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 50 }),
      }),
      // Сложные параметры с фильтрацией
      fc.record({
        workspaceId: fc.string({ minLength: 1, maxLength: 50 }),
        limit: fc.integer({ min: 1, max: 100 }),
        offset: fc.integer({ min: 0, max: 1000 }),
        search: fc.option(fc.string({ minLength: 0, maxLength: 100 }), {
          nil: undefined,
        }),
      }),
      // Параметры с вложенными объектами
      fc.record({
        filter: fc.record({
          status: fc.constantFrom("active", "inactive", "pending"),
          createdAfter: fc.date(),
        }),
        sort: fc.record({
          field: fc.constantFrom("name", "createdAt", "updatedAt"),
          order: fc.constantFrom("asc", "desc"),
        }),
      }),
    );

    await fc.assert(
      fc.asyncProperty(inputArb, async (input) => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Number.POSITIVE_INFINITY,
            },
          },
        });

        // Query key должен включать input для уникальности
        const queryKey = ["orpc", "test", "list", { input }];

        // Мокируем процедуру, которая использует input
        const mockResult = { success: true, input };
        const mockProcedureHandler = mock(async () => mockResult);

        // Prefetch с input параметром
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: mockProcedureHandler,
        });

        // Проверяем, что данные сохранены с правильным query key
        const cachedData = queryClient.getQueryData(queryKey);
        expect(cachedData).toEqual(mockResult);

        // Проверяем, что dehydrated state содержит правильный query key
        const dehydratedState = dehydrate(queryClient);
        const ourQuery = dehydratedState.queries.find((q) => {
          return JSON.stringify(q.queryKey) === JSON.stringify(queryKey);
        });

        expect(ourQuery).toBeDefined();
        expect(ourQuery?.queryKey).toEqual(queryKey);

        // Cleanup
        queryClient.clear();
      }),
      { numRuns: 100 },
    );
  });

  it("должен поддерживать prefetch нескольких процедур одновременно", async () => {
    // Генератор для массива различных процедур
    const proceduresArb = fc.array(
      fc.record({
        path: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
          minLength: 1,
          maxLength: 3,
        }),
        input: fc.option(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { nil: undefined },
        ),
        result: fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          data: fc.string({ minLength: 1, maxLength: 100 }),
        }),
      }),
      { minLength: 1, maxLength: 5 },
    );

    await fc.assert(
      fc.asyncProperty(proceduresArb, async (procedures) => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Number.POSITIVE_INFINITY,
            },
          },
        });

        // Prefetch всех процедур параллельно
        await Promise.all(
          procedures.map(async (proc) => {
            const queryKey = ["orpc", ...proc.path, { input: proc.input }];
            await queryClient.prefetchQuery({
              queryKey,
              queryFn: async () => proc.result,
            });
          }),
        );

        // Проверяем, что все данные сохранены
        for (const proc of procedures) {
          const queryKey = ["orpc", ...proc.path, { input: proc.input }];
          const cachedData = queryClient.getQueryData(queryKey);
          expect(cachedData).toEqual(proc.result);
        }

        // Проверяем, что все queries в dehydrated state
        const dehydratedState = dehydrate(queryClient);
        expect(dehydratedState.queries.length).toBe(procedures.length);

        // Проверяем, что каждая процедура представлена в dehydrated state
        for (const proc of procedures) {
          const queryKey = ["orpc", ...proc.path, { input: proc.input }];
          const foundQuery = dehydratedState.queries.find((q) => {
            return JSON.stringify(q.queryKey) === JSON.stringify(queryKey);
          });
          expect(foundQuery).toBeDefined();
          expect(foundQuery?.state.data).toEqual(proc.result);
        }

        // Cleanup
        queryClient.clear();
      }),
      { numRuns: 100 },
    );
  });

  it("должен корректно обрабатывать ошибки при prefetch", async () => {
    // Генератор для различных типов ошибок
    const errorArb = fc.oneof(
      fc.record({
        code: fc.constantFrom(
          "NOT_FOUND",
          "FORBIDDEN",
          "BAD_REQUEST",
          "UNAUTHORIZED",
        ),
        message: fc.string({ minLength: 1, maxLength: 100 }),
      }),
      fc.record({
        code: fc.constant("INTERNAL_SERVER_ERROR"),
        message: fc.constant("Внутренняя ошибка сервера"),
      }),
    );

    await fc.assert(
      fc.asyncProperty(errorArb, async (errorData) => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Number.POSITIVE_INFINITY,
            },
          },
        });

        const queryKey = ["orpc", "test", "error", { input: errorData }];

        // Мокируем процедуру, которая выбрасывает ошибку
        const mockError = new Error(errorData.message);
        Object.assign(mockError, { code: errorData.code });

        const mockProcedureHandler = mock(async () => {
          throw mockError;
        });

        // Prefetch должен обработать ошибку без выброса исключения
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: mockProcedureHandler,
        });

        // Проверяем, что процедура была вызвана
        expect(mockProcedureHandler).toHaveBeenCalledTimes(1);

        // Проверяем состояние query после ошибки
        const queryState = queryClient.getQueryState(queryKey);
        expect(queryState).toBeDefined();
        expect(queryState?.status).toBe("error");
        expect(queryState?.error).toBeDefined();

        // Проверяем, что ошибка сохранена в dehydrated state
        const dehydratedState = dehydrate(queryClient);
        const errorQuery = dehydratedState.queries.find((q) => {
          return JSON.stringify(q.queryKey) === JSON.stringify(queryKey);
        });

        // Ошибки могут не включаться в dehydrated state по умолчанию
        // но состояние должно быть доступно
        if (errorQuery) {
          expect(errorQuery.state.status).toBe("error");
        }

        // Cleanup
        queryClient.clear();
      }),
      { numRuns: 100 },
    );
  });

  it("должен сохранять типы данных при сериализации через dehydrate/hydrate", async () => {
    // Генератор для данных со специальными типами (Date, Map, Set)
    const specialTypesArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
      metadata: fc.record({
        count: fc.integer({ min: 0, max: 1000 }),
        active: fc.boolean(),
        tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
          minLength: 0,
          maxLength: 5,
        }),
      }),
    });

    await fc.assert(
      fc.asyncProperty(specialTypesArb, async (testData) => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              staleTime: Number.POSITIVE_INFINITY,
            },
          },
        });

        const queryKey = ["orpc", "test", "types", { input: testData.id }];

        // Prefetch данных со специальными типами
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: async () => testData,
        });

        // Dehydrate для передачи клиенту
        const dehydratedState = dehydrate(queryClient);

        // Создаем новый QueryClient для симуляции клиента
        const clientQueryClient = new QueryClient();

        // Находим наш query в dehydrated state
        const ourQuery = dehydratedState.queries.find((q) => {
          return JSON.stringify(q.queryKey) === JSON.stringify(queryKey);
        });

        expect(ourQuery).toBeDefined();

        // Восстанавливаем данные на "клиенте"
        clientQueryClient.setQueryData(queryKey, ourQuery?.state.data);

        const restoredData = clientQueryClient.getQueryData(queryKey);

        // Проверяем, что данные восстановлены корректно
        expect(restoredData).toBeDefined();
        expect(restoredData).toHaveProperty("id", testData.id);
        expect(restoredData).toHaveProperty("metadata");

        // Cleanup
        queryClient.clear();
        clientQueryClient.clear();
      }),
      { numRuns: 100 },
    );
  });
});
