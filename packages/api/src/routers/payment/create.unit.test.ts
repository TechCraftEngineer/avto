import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { randomUUID } from "node:crypto";
import { call, ORPCError } from "@orpc/server";
import type { payment } from "@qbs-autonaim/db/schema";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import type { YookassaClient } from "../../services/yookassa/client";
import { create } from "./create";

/**
 * Unit-тесты для процедуры создания платежа
 *
 * Тестируемые сценарии:
 * 1. Успешное создание платежа с валидными данными
 * 2. Ошибка при отсутствии доступа к workspace
 * 3. Ошибка при несуществующем workspace
 * 4. Обработка ошибки API ЮКасса
 * 5. Корректное заполнение organizationId из workspace
 *
 * **Валидирует: Требования 1.1, 1.5, 1.6, 5.8**
 */

describe("create payment - Unit Tests", () => {
  let originalFetch: typeof global.fetch;
  let _mockYookassaClient: YookassaClient;

  beforeEach(() => {
    originalFetch = global.fetch;

    // Мокируем переменные окружения
    process.env.YOOKASSA_SHOP_ID = "test-shop-id";
    process.env.YOOKASSA_SECRET_KEY = "test-secret-key";
    process.env.YOOKASSA_API_URL = "https://api.yookassa.ru/v3";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * Тест 1: Успешное создание платежа с валидными данными
   *
   * Проверяет, что при наличии всех необходимых данных и доступа к workspace
   * платеж успешно создается в ЮКасса и сохраняется в БД.
   *
   * **Валидирует: Требование 1.1**
   */
  it("успешно создает платеж с валидными данными", async () => {
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testUserId = "user_test789";
    const testYookassaId = `yookassa_${randomUUID()}`;

    // Мокируем успешный ответ от ЮКасса
    const mockYookassaResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "pending",
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        confirmation_url: "https://yookassa.ru/checkout/test",
      },
      created_at: new Date().toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockYookassaResponse,
    })) as unknown as typeof global.fetch;

    // Мокируем контекст tRPC
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      workspaceRepository: {
        findById: mock(async (id: string) => {
          if (id === testWorkspaceId) {
            return {
              id: testWorkspaceId,
              organizationId: testOrganizationId,
              name: "Test Workspace",
              slug: "test-workspace",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          return null;
        }),
        checkAccess: mock(async (workspaceId: string, userId: string) => {
          return workspaceId === testWorkspaceId && userId === testUserId
            ? { workspaceId, userId, role: "member" }
            : null;
        }),
      },
      db: {
        insert: mock((_table: typeof payment) => ({
          values: mock((data: unknown) => ({
            returning: mock(async () => [
              {
                id: randomUUID(),
                yookassaId: testYookassaId,
                idempotenceKey: (data as { idempotenceKey: string })
                  .idempotenceKey,
                userId: testUserId,
                workspaceId: testWorkspaceId,
                organizationId: testOrganizationId,
                amount: "1000",
                currency: "RUB",
                status: "pending",
                description: "Тестовый платеж",
                returnUrl: "https://example.com/return",
                confirmationUrl: "https://yookassa.ru/checkout/test",
                metadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                completedAt: null,
              },
            ]),
          })),
        })),
      },
    };

    // Выполняем процедуру
    const input = {
      amount: 1000,
      currency: "RUB" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      workspaceId: testWorkspaceId,
    };

    const result = await call(create, input, {
      context: mockContext as never,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(result.yookassaId).toBe(testYookassaId);
    expect(result.amount).toBe("1000");
    expect(result.currency).toBe("RUB");
    expect(result.status).toBe("pending");
    expect(result.confirmationUrl).toBe("https://yookassa.ru/checkout/test");

    // Проверяем, что методы были вызваны
    expect(mockContext.workspaceRepository.findById).toHaveBeenCalledWith(
      testWorkspaceId,
    );
    expect(mockContext.workspaceRepository.checkAccess).toHaveBeenCalledWith(
      testWorkspaceId,
      testUserId,
    );
  });

  /**
   * Тест 2: Ошибка при отсутствии доступа к workspace
   *
   * Проверяет, что если пользователь не имеет доступа к workspace,
   * выбрасывается ошибка FORBIDDEN.
   *
   * **Валидирует: Требование 1.6**
   */
  it("выбрасывает ошибку FORBIDDEN при отсутствии доступа к workspace", async () => {
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testUserId = "user_test789";

    // Мокируем контекст с отсутствием доступа
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      workspaceRepository: {
        findById: mock(async (id: string) => {
          if (id === testWorkspaceId) {
            return {
              id: testWorkspaceId,
              organizationId: testOrganizationId,
              name: "Test Workspace",
              slug: "test-workspace",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          return null;
        }),
        checkAccess: mock(async () => null), // Нет доступа
      },
      db: {},
    };

    const input = {
      amount: 1000,
      currency: "RUB" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      workspaceId: testWorkspaceId,
    };

    // Проверяем, что выбрасывается ошибка FORBIDDEN
    await expect(
      call(create, input, {
        context: mockContext as never,
      }),
    ).rejects.toThrow(ORPCError);

    await expect(
      call(create, input, {
        context: mockContext as never,
      }),
    ).rejects.toThrow("Нет доступа к workspace");
  });

  /**
   * Тест 3: Ошибка при несуществующем workspace
   *
   * Проверяет, что если workspace не существует,
   * выбрасывается ошибка NOT_FOUND.
   *
   * **Валидирует: Требование 1.6**
   */
  it("выбрасывает ошибку NOT_FOUND при несуществующем workspace", async () => {
    const testWorkspaceId = "ws_nonexistent";
    const testUserId = "user_test789";

    // Мокируем контекст с несуществующим workspace
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      workspaceRepository: {
        findById: mock(async () => null), // Workspace не найден
        checkAccess: mock(async () => null),
      },
      db: {},
    };

    const input = {
      amount: 1000,
      currency: "RUB" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      workspaceId: testWorkspaceId,
    };

    // Проверяем, что выбрасывается ошибка NOT_FOUND
    await expect(
      call(create, input, {
        context: mockContext as never,
      }),
    ).rejects.toThrow(ORPCError);

    await expect(
      call(create, input, {
        context: mockContext as never,
      }),
    ).rejects.toThrow("Workspace не найден");
  });

  /**
   * Тест 4: Обработка ошибки API ЮКасса
   *
   * Проверяет, что ошибки от API ЮКасса корректно обрабатываются
   * и возвращаются пользователю с понятным сообщением.
   *
   * **Валидирует: Требование 1.5**
   */
  it("корректно обрабатывает ошибку API ЮКасса", async () => {
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testUserId = "user_test789";

    // Мокируем ошибку от ЮКасса
    global.fetch = mock(async () => ({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({
        type: "error",
        id: "error_id",
        code: "invalid_request",
        description: "Некорректная сумма платежа",
      }),
    })) as unknown as typeof global.fetch;

    // Мокируем контекст
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      workspaceRepository: {
        findById: mock(async (id: string) => {
          if (id === testWorkspaceId) {
            return {
              id: testWorkspaceId,
              organizationId: testOrganizationId,
              name: "Test Workspace",
              slug: "test-workspace",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          return null;
        }),
        checkAccess: mock(async (workspaceId: string, userId: string) => {
          return workspaceId === testWorkspaceId && userId === testUserId
            ? { workspaceId, userId, role: "member" }
            : null;
        }),
      },
      db: {},
    };

    const input = {
      amount: 1000,
      currency: "RUB" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      workspaceId: testWorkspaceId,
    };

    // Проверяем, что ошибка ЮКасса обрабатывается
    await expect(
      call(create, input, {
        context: mockContext as never,
      }),
    ).rejects.toThrow(ORPCError);

    await expect(
      call(create, input, {
        context: mockContext as never,
      }),
    ).rejects.toThrow("Ошибка создания платежа");
  });

  /**
   * Тест 5: Корректное заполнение organizationId из workspace
   *
   * Проверяет, что organizationId автоматически извлекается из workspace
   * и сохраняется в платеже.
   *
   * **Валидирует: Требование 5.8**
   */
  it("корректно заполняет organizationId из workspace", async () => {
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testUserId = "user_test789";
    const testYookassaId = `yookassa_${randomUUID()}`;

    let savedOrganizationId: string | undefined;

    // Мокируем успешный ответ от ЮКасса
    const mockYookassaResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "pending",
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        confirmation_url: "https://yookassa.ru/checkout/test",
      },
      created_at: new Date().toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockYookassaResponse,
    })) as unknown as typeof global.fetch;

    // Мокируем контекст с перехватом organizationId
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      workspaceRepository: {
        findById: mock(async (id: string) => {
          if (id === testWorkspaceId) {
            return {
              id: testWorkspaceId,
              organizationId: testOrganizationId,
              name: "Test Workspace",
              slug: "test-workspace",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          return null;
        }),
        checkAccess: mock(async (workspaceId: string, userId: string) => {
          return workspaceId === testWorkspaceId && userId === testUserId
            ? { workspaceId, userId, role: "member" }
            : null;
        }),
      },
      db: {
        insert: mock((_table: typeof payment) => ({
          values: mock(
            (data: {
              organizationId: string;
              workspaceId: string;
              userId: string;
            }) => {
              // Перехватываем organizationId
              savedOrganizationId = data.organizationId;

              return {
                returning: mock(async () => [
                  {
                    id: randomUUID(),
                    yookassaId: testYookassaId,
                    idempotenceKey: randomUUID(),
                    userId: data.userId,
                    workspaceId: data.workspaceId,
                    organizationId: data.organizationId,
                    amount: "1000",
                    currency: "RUB",
                    status: "pending",
                    description: "Тестовый платеж",
                    returnUrl: "https://example.com/return",
                    confirmationUrl: "https://yookassa.ru/checkout/test",
                    metadata: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    completedAt: null,
                  },
                ]),
              };
            },
          ),
        })),
      },
    };

    const input = {
      amount: 1000,
      currency: "RUB" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      workspaceId: testWorkspaceId,
    };

    await call(create, input, {
      context: mockContext as never,
    });

    // Проверяем, что organizationId был корректно извлечен и сохранен
    expect(savedOrganizationId).toBe(testOrganizationId);
  });
});
