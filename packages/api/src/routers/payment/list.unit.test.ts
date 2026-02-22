import { beforeEach, describe, expect, it, mock } from "bun:test";
import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { list } from "./list";

/**
 * Unit-тесты для процедуры получения списка платежей
 *
 * Тестируемые сценарии:
 * 1. Получение всех платежей пользователя
 * 2. Фильтрация по workspace
 * 3. Фильтрация по organization
 * 4. Пагинация
 * 5. Проверка доступа к workspace/organization
 *
 * **Валидирует: Требования 5.1, 5.2, 5.3, 5.4**
 */

describe("list payments - Unit Tests", () => {
  beforeEach(() => {
    // Настройка окружения перед каждым тестом
  });

  /**
   * Тест 1: Получение всех платежей пользователя
   *
   * Проверяет, что пользователь может получить список всех своих платежей
   * без фильтрации по workspace или organization.
   *
   * **Валидирует: Требования 5.1, 5.2**
   */
  it("возвращает все платежи пользователя", async () => {
    const testUserId = "user_test789";
    const testWorkspaceId1 = "ws_test123";
    const testWorkspaceId2 = "ws_test456";
    const testOrganizationId = "org_test789";

    const mockPayments = [
      {
        id: randomUUID(),
        yookassaId: `yookassa_${randomUUID()}`,
        idempotenceKey: randomUUID(),
        userId: testUserId,
        workspaceId: testWorkspaceId1,
        organizationId: testOrganizationId,
        amount: "1000.00",
        currency: "RUB" as const,
        status: "succeeded" as const,
        description: "Платеж 1",
        returnUrl: "https://example.com/return",
        confirmationUrl: "https://yookassa.ru/checkout/test1",
        metadata: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        completedAt: new Date("2024-01-15"),
      },
      {
        id: randomUUID(),
        yookassaId: `yookassa_${randomUUID()}`,
        idempotenceKey: randomUUID(),
        userId: testUserId,
        workspaceId: testWorkspaceId2,
        organizationId: testOrganizationId,
        amount: "2000.00",
        currency: "RUB" as const,
        status: "pending" as const,
        description: "Платеж 2",
        returnUrl: "https://example.com/return",
        confirmationUrl: "https://yookassa.ru/checkout/test2",
        metadata: null,
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-14"),
        completedAt: null,
      },
    ];

    // Мокируем контекст tRPC
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      db: {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(() => ({
              orderBy: mock(() => ({
                limit: mock(() => ({
                  offset: mock(async () => mockPayments),
                })),
              })),
            })),
          })),
        })),
      },
      workspaceRepository: {},
      organizationRepository: {},
    };

    const input = {
      limit: 20,
      offset: 0,
    };

    // Выполняем процедуру
    const result = await list({
      ctx: mockContext as never,
      input,
      type: "query",
      path: "payment.list",
      getRawInput: async () => input,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result[0]?.userId).toBe(testUserId);
    expect(result[1]?.userId).toBe(testUserId);
    expect(result[0]?.amount).toBe("1000.00");
    expect(result[1]?.amount).toBe("2000.00");
  });

  /**
   * Тест 2: Фильтрация по workspace
   *
   * Проверяет, что пользователь может получить список платежей
   * отфильтрованных по конкретному workspace.
   *
   * **Валидирует: Требования 5.1, 5.3**
   */
  it("фильтрует платежи по workspace", async () => {
    const testUserId = "user_test789";
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test789";

    const mockPayments = [
      {
        id: randomUUID(),
        yookassaId: `yookassa_${randomUUID()}`,
        idempotenceKey: randomUUID(),
        userId: testUserId,
        workspaceId: testWorkspaceId,
        organizationId: testOrganizationId,
        amount: "1000.00",
        currency: "RUB" as const,
        status: "succeeded" as const,
        description: "Платеж для workspace",
        returnUrl: "https://example.com/return",
        confirmationUrl: "https://yookassa.ru/checkout/test",
        metadata: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        completedAt: new Date("2024-01-15"),
      },
    ];

    // Мокируем контекст с проверкой доступа к workspace
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      db: {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(() => ({
              orderBy: mock(() => ({
                limit: mock(() => ({
                  offset: mock(async () => mockPayments),
                })),
              })),
            })),
          })),
        })),
      },
      workspaceRepository: {
        checkAccess: mock(async (workspaceId: string, userId: string) => {
          return workspaceId === testWorkspaceId && userId === testUserId
            ? { workspaceId, userId, role: "member" }
            : null;
        }),
      },
      organizationRepository: {},
    };

    const input = {
      workspaceId: testWorkspaceId,
      limit: 20,
      offset: 0,
    };

    // Выполняем процедуру
    const result = await list({
      ctx: mockContext as never,
      input,
      type: "query",
      path: "payment.list",
      getRawInput: async () => input,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result[0]?.workspaceId).toBe(testWorkspaceId);
    expect(mockContext.workspaceRepository.checkAccess).toHaveBeenCalledWith(
      testWorkspaceId,
      testUserId,
    );
  });

  /**
   * Тест 3: Фильтрация по organization
   *
   * Проверяет, что пользователь может получить список платежей
   * отфильтрованных по organization для консолидированной отчетности.
   *
   * **Валидирует: Требования 5.1, 5.4**
   */
  it("фильтрует платежи по organization", async () => {
    const testUserId = "user_test789";
    const testWorkspaceId1 = "ws_test123";
    const testWorkspaceId2 = "ws_test456";
    const testOrganizationId = "org_test789";

    const mockPayments = [
      {
        id: randomUUID(),
        yookassaId: `yookassa_${randomUUID()}`,
        idempotenceKey: randomUUID(),
        userId: testUserId,
        workspaceId: testWorkspaceId1,
        organizationId: testOrganizationId,
        amount: "1000.00",
        currency: "RUB" as const,
        status: "succeeded" as const,
        description: "Платеж 1",
        returnUrl: "https://example.com/return",
        confirmationUrl: "https://yookassa.ru/checkout/test1",
        metadata: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        completedAt: new Date("2024-01-15"),
      },
      {
        id: randomUUID(),
        yookassaId: `yookassa_${randomUUID()}`,
        idempotenceKey: randomUUID(),
        userId: testUserId,
        workspaceId: testWorkspaceId2,
        organizationId: testOrganizationId,
        amount: "2000.00",
        currency: "RUB" as const,
        status: "pending" as const,
        description: "Платеж 2",
        returnUrl: "https://example.com/return",
        confirmationUrl: "https://yookassa.ru/checkout/test2",
        metadata: null,
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-14"),
        completedAt: null,
      },
    ];

    // Мокируем контекст с проверкой доступа к organization
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      db: {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(() => ({
              orderBy: mock(() => ({
                limit: mock(() => ({
                  offset: mock(async () => mockPayments),
                })),
              })),
            })),
          })),
        })),
      },
      workspaceRepository: {},
      organizationRepository: {
        checkAccess: mock(async (organizationId: string, userId: string) => {
          return organizationId === testOrganizationId && userId === testUserId
            ? { organizationId, userId, role: "member" }
            : null;
        }),
      },
    };

    const input = {
      organizationId: testOrganizationId,
      limit: 20,
      offset: 0,
    };

    // Выполняем процедуру
    const result = await list({
      ctx: mockContext as never,
      input,
      type: "query",
      path: "payment.list",
      getRawInput: async () => input,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result[0]?.organizationId).toBe(testOrganizationId);
    expect(result[1]?.organizationId).toBe(testOrganizationId);
    expect(mockContext.organizationRepository.checkAccess).toHaveBeenCalledWith(
      testOrganizationId,
      testUserId,
    );
  });

  /**
   * Тест 4: Пагинация
   *
   * Проверяет, что пагинация работает корректно с параметрами limit и offset.
   *
   * **Валидирует: Требование 5.1**
   */
  it("корректно применяет пагинацию", async () => {
    const testUserId = "user_test789";
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test789";

    // Создаем 3 платежа для теста пагинации
    const mockPayments = [
      {
        id: randomUUID(),
        yookassaId: `yookassa_${randomUUID()}`,
        idempotenceKey: randomUUID(),
        userId: testUserId,
        workspaceId: testWorkspaceId,
        organizationId: testOrganizationId,
        amount: "3000.00",
        currency: "RUB" as const,
        status: "succeeded" as const,
        description: "Платеж 3",
        returnUrl: "https://example.com/return",
        confirmationUrl: "https://yookassa.ru/checkout/test3",
        metadata: null,
        createdAt: new Date("2024-01-13"),
        updatedAt: new Date("2024-01-13"),
        completedAt: new Date("2024-01-13"),
      },
    ];

    let capturedLimit: number | undefined;
    let capturedOffset: number | undefined;

    // Мокируем контекст с перехватом параметров пагинации
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      db: {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(() => ({
              orderBy: mock(() => ({
                limit: mock((limit: number) => {
                  capturedLimit = limit;
                  return {
                    offset: mock(async (offset: number) => {
                      capturedOffset = offset;
                      return mockPayments;
                    }),
                  };
                }),
              })),
            })),
          })),
        })),
      },
      workspaceRepository: {},
      organizationRepository: {},
    };

    const input = {
      limit: 10,
      offset: 5,
    };

    // Выполняем процедуру
    const result = await list({
      ctx: mockContext as never,
      input,
      type: "query",
      path: "payment.list",
      getRawInput: async () => input,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(capturedLimit).toBe(10);
    expect(capturedOffset).toBe(5);
  });

  /**
   * Тест 5: Ошибка FORBIDDEN при отсутствии доступа к workspace
   *
   * Проверяет, что если пользователь не имеет доступа к workspace,
   * выбрасывается ошибка FORBIDDEN.
   *
   * **Валидирует: Требование 5.3**
   */
  it("выбрасывает ошибку FORBIDDEN при отсутствии доступа к workspace", async () => {
    const testUserId = "user_test789";
    const testWorkspaceId = "ws_test123";

    // Мокируем контекст с отсутствием доступа
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      db: {},
      workspaceRepository: {
        checkAccess: mock(async () => null), // Нет доступа
      },
      organizationRepository: {},
    };

    const input = {
      workspaceId: testWorkspaceId,
      limit: 20,
      offset: 0,
    };

    // Проверяем, что выбрасывается ошибка FORBIDDEN
    try {
      await list({
        ctx: mockContext as never,
        input,
        type: "query",
        path: "payment.list",
        getRawInput: async () => input,
      });
      expect(true).toBe(false); // Не должно дойти до этой строки
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toBe("Нет доступа к workspace");
    }
  });

  /**
   * Тест 6: Ошибка FORBIDDEN при отсутствии доступа к organization
   *
   * Проверяет, что если пользователь не имеет доступа к organization,
   * выбрасывается ошибка FORBIDDEN.
   *
   * **Валидирует: Требование 5.4**
   */
  it("выбрасывает ошибку FORBIDDEN при отсутствии доступа к organization", async () => {
    const testUserId = "user_test789";
    const testOrganizationId = "org_test789";

    // Мокируем контекст с отсутствием доступа
    const mockContext = {
      session: {
        user: {
          id: testUserId,
          email: "test@example.com",
        },
      },
      db: {},
      workspaceRepository: {},
      organizationRepository: {
        checkAccess: mock(async () => null), // Нет доступа
      },
    };

    const input = {
      organizationId: testOrganizationId,
      limit: 20,
      offset: 0,
    };

    // Проверяем, что выбрасывается ошибка FORBIDDEN
    try {
      await list({
        ctx: mockContext as never,
        input,
        type: "query",
        path: "payment.list",
        getRawInput: async () => input,
      });
      expect(true).toBe(false); // Не должно дойти до этой строки
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toBe("Нет доступа к организации");
    }
  });
});
