import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { randomUUID } from "node:crypto";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { checkStatus } from "./check-status";

/**
 * Unit-тесты для процедуры проверки статуса платежа
 *
 * Тестируемые сценарии:
 * 1. Успешная проверка и обновление статуса (pending → succeeded)
 * 2. Успешная проверка и обновление статуса (pending → canceled)
 * 3. Проверка статуса без изменений (статус остается тем же)
 * 4. Ошибка для несуществующего платежа
 * 5. Ошибка для доступа к чужому платежу (FORBIDDEN)
 * 6. Установка completedAt при завершении платежа
 * 7. Обработка ошибки API ЮКасса (платеж не найден в ЮКасса)
 *
 * **Валидирует: Требования 4.1, 4.2, 4.3, 8.2**
 */

describe("check-status payment - Unit Tests", () => {
  let originalFetch: typeof global.fetch;

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
   * Тест 1: Успешная проверка и обновление статуса (pending → succeeded)
   *
   * Проверяет, что при изменении статуса платежа в ЮКасса с pending на succeeded,
   * система корректно обновляет статус в БД и устанавливает completedAt.
   *
   * **Валидирует: Требования 4.1, 4.2, 8.2**
   */
  it("успешно обновляет статус с pending на succeeded", async () => {
    const testPaymentId = randomUUID();
    const testUserId = "user_test789";
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testYookassaId = `yookassa_${randomUUID()}`;

    const mockExistingPayment = {
      id: testPaymentId,
      yookassaId: testYookassaId,
      idempotenceKey: randomUUID(),
      userId: testUserId,
      workspaceId: testWorkspaceId,
      organizationId: testOrganizationId,
      amount: "1000.00",
      currency: "RUB" as const,
      status: "pending" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      confirmationUrl: "https://yookassa.ru/checkout/test",
      metadata: null,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      completedAt: null,
    };

    // Мокируем успешный ответ от ЮКасса со статусом succeeded
    const mockYookassaResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "succeeded",
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      created_at: new Date("2024-01-15T10:00:00Z").toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockYookassaResponse,
    })) as typeof global.fetch;

    let updatedStatus: string | undefined;
    let updatedCompletedAt: Date | null | undefined;

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
              limit: mock(async () => [mockExistingPayment]),
            })),
          })),
        })),
        update: mock(() => ({
          set: mock((data: { status: string; completedAt: Date | null }) => {
            updatedStatus = data.status;
            updatedCompletedAt = data.completedAt;
            return {
              where: mock(async () => {}),
            };
          }),
        })),
      },
    };

    const input = {
      paymentId: testPaymentId,
    };

    // Выполняем процедуру
    const result = await checkStatus({
      ctx: mockContext as never,
      input,
      type: "query",
      path: "payment.checkStatus",
      getRawInput: async () => input,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(result.id).toBe(testPaymentId);
    expect(result.status).toBe("succeeded");
    expect(updatedStatus).toBe("succeeded");
    expect(updatedCompletedAt).toBeInstanceOf(Date);
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  /**
   * Тест 2: Успешная проверка и обновление статуса (pending → canceled)
   *
   * Проверяет, что при изменении статуса платежа в ЮКасса с pending на canceled,
   * система корректно обновляет статус в БД и устанавливает completedAt.
   *
   * **Валидирует: Требования 4.1, 4.2, 8.2**
   */
  it("успешно обновляет статус с pending на canceled", async () => {
    const testPaymentId = randomUUID();
    const testUserId = "user_test789";
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testYookassaId = `yookassa_${randomUUID()}`;

    const mockExistingPayment = {
      id: testPaymentId,
      yookassaId: testYookassaId,
      idempotenceKey: randomUUID(),
      userId: testUserId,
      workspaceId: testWorkspaceId,
      organizationId: testOrganizationId,
      amount: "1000.00",
      currency: "RUB" as const,
      status: "pending" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      confirmationUrl: "https://yookassa.ru/checkout/test",
      metadata: null,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      completedAt: null,
    };

    // Мокируем ответ от ЮКасса со статусом canceled
    const mockYookassaResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "canceled",
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      created_at: new Date("2024-01-15T10:00:00Z").toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockYookassaResponse,
    })) as typeof global.fetch;

    let updatedStatus: string | undefined;
    let updatedCompletedAt: Date | null | undefined;

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
              limit: mock(async () => [mockExistingPayment]),
            })),
          })),
        })),
        update: mock(() => ({
          set: mock((data: { status: string; completedAt: Date | null }) => {
            updatedStatus = data.status;
            updatedCompletedAt = data.completedAt;
            return {
              where: mock(async () => {}),
            };
          }),
        })),
      },
    };

    const input = {
      paymentId: testPaymentId,
    };

    // Выполняем процедуру
    const result = await checkStatus({
      ctx: mockContext as never,
      input,
      type: "query",
      path: "payment.checkStatus",
      getRawInput: async () => input,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(result.id).toBe(testPaymentId);
    expect(result.status).toBe("canceled");
    expect(updatedStatus).toBe("canceled");
    expect(updatedCompletedAt).toBeInstanceOf(Date);
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  /**
   * Тест 3: Проверка статуса без изменений (статус остается тем же)
   *
   * Проверяет, что если статус платежа в ЮКасса не изменился,
   * система не обновляет запись в БД и возвращает текущие данные.
   *
   * **Валидирует: Требования 4.1, 4.2**
   */
  it("не обновляет БД если статус не изменился", async () => {
    const testPaymentId = randomUUID();
    const testUserId = "user_test789";
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testYookassaId = `yookassa_${randomUUID()}`;

    const mockExistingPayment = {
      id: testPaymentId,
      yookassaId: testYookassaId,
      idempotenceKey: randomUUID(),
      userId: testUserId,
      workspaceId: testWorkspaceId,
      organizationId: testOrganizationId,
      amount: "1000.00",
      currency: "RUB" as const,
      status: "pending" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      confirmationUrl: "https://yookassa.ru/checkout/test",
      metadata: null,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      completedAt: null,
    };

    // Мокируем ответ от ЮКасса с тем же статусом pending
    const mockYookassaResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "pending",
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      created_at: new Date("2024-01-15T10:00:00Z").toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockYookassaResponse,
    })) as typeof global.fetch;

    const updateMock = mock(() => ({
      set: mock(() => ({
        where: mock(async () => {}),
      })),
    }));

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
              limit: mock(async () => [mockExistingPayment]),
            })),
          })),
        })),
        update: updateMock,
      },
    };

    const input = {
      paymentId: testPaymentId,
    };

    // Выполняем процедуру
    const result = await checkStatus({
      ctx: mockContext as never,
      input,
      type: "query",
      path: "payment.checkStatus",
      getRawInput: async () => input,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(result.id).toBe(testPaymentId);
    expect(result.status).toBe("pending");
    expect(result.completedAt).toBeNull();
    // Проверяем, что update НЕ был вызван
    expect(updateMock).not.toHaveBeenCalled();
  });

  /**
   * Тест 4: Ошибка для несуществующего платежа
   *
   * Проверяет, что при попытке проверить статус несуществующего платежа
   * выбрасывается ошибка NOT_FOUND.
   *
   * **Валидирует: Требование 4.3**
   */
  it("выбрасывает ошибку NOT_FOUND для несуществующего платежа", async () => {
    const testPaymentId = randomUUID();
    const testUserId = "user_test789";

    // Мокируем контекст с пустым результатом
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
              limit: mock(async () => []), // Платеж не найден
            })),
          })),
        })),
      },
    };

    const input = {
      paymentId: testPaymentId,
    };

    // Проверяем, что выбрасывается ошибка NOT_FOUND
    try {
      await checkStatus({
        ctx: mockContext as never,
        input,
        type: "query",
        path: "payment.checkStatus",
        getRawInput: async () => input,
      });
      expect(true).toBe(false); // Не должно дойти до этой строки
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("NOT_FOUND");
      expect((error as TRPCError).message).toBe("Платеж не найден");
    }
  });

  /**
   * Тест 5: Ошибка для доступа к чужому платежу (FORBIDDEN)
   *
   * Проверяет, что пользователь не может проверить статус платежа
   * другого пользователя.
   *
   * **Валидирует: Требование 8.2**
   */
  it("выбрасывает ошибку FORBIDDEN для чужого платежа", async () => {
    const testPaymentId = randomUUID();
    const testUserId = "user_test789";
    const otherUserId = "user_other123";
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testYookassaId = `yookassa_${randomUUID()}`;

    const mockExistingPayment = {
      id: testPaymentId,
      yookassaId: testYookassaId,
      idempotenceKey: randomUUID(),
      userId: otherUserId, // Платеж принадлежит другому пользователю
      workspaceId: testWorkspaceId,
      organizationId: testOrganizationId,
      amount: "1000.00",
      currency: "RUB" as const,
      status: "pending" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      confirmationUrl: "https://yookassa.ru/checkout/test",
      metadata: null,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      completedAt: null,
    };

    // Мокируем контекст
    const mockContext = {
      session: {
        user: {
          id: testUserId, // Текущий пользователь
          email: "test@example.com",
        },
      },
      db: {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(() => ({
              limit: mock(async () => [mockExistingPayment]),
            })),
          })),
        })),
      },
    };

    const input = {
      paymentId: testPaymentId,
    };

    // Проверяем, что выбрасывается ошибка FORBIDDEN
    try {
      await checkStatus({
        ctx: mockContext as never,
        input,
        type: "query",
        path: "payment.checkStatus",
        getRawInput: async () => input,
      });
      expect(true).toBe(false); // Не должно дойти до этой строки
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toBe("Нет доступа к этому платежу");
    }
  });

  /**
   * Тест 6: Установка completedAt при завершении платежа
   *
   * Проверяет, что при изменении статуса на succeeded или canceled
   * поле completedAt устанавливается в текущую дату.
   *
   * **Валидирует: Требование 4.2**
   */
  it("устанавливает completedAt при завершении платежа", async () => {
    const testPaymentId = randomUUID();
    const testUserId = "user_test789";
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testYookassaId = `yookassa_${randomUUID()}`;

    const mockExistingPayment = {
      id: testPaymentId,
      yookassaId: testYookassaId,
      idempotenceKey: randomUUID(),
      userId: testUserId,
      workspaceId: testWorkspaceId,
      organizationId: testOrganizationId,
      amount: "1000.00",
      currency: "RUB" as const,
      status: "pending" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      confirmationUrl: "https://yookassa.ru/checkout/test",
      metadata: null,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      completedAt: null,
    };

    // Мокируем ответ от ЮКасса со статусом succeeded
    const mockYookassaResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "succeeded",
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      created_at: new Date("2024-01-15T10:00:00Z").toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockYookassaResponse,
    })) as typeof global.fetch;

    let capturedCompletedAt: Date | null | undefined;

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
              limit: mock(async () => [mockExistingPayment]),
            })),
          })),
        })),
        update: mock(() => ({
          set: mock((data: { completedAt: Date | null }) => {
            capturedCompletedAt = data.completedAt;
            return {
              where: mock(async () => {}),
            };
          }),
        })),
      },
    };

    const input = {
      paymentId: testPaymentId,
    };

    // Выполняем процедуру
    const result = await checkStatus({
      ctx: mockContext as never,
      input,
      type: "query",
      path: "payment.checkStatus",
      getRawInput: async () => input,
    });

    // Проверки
    expect(result).toBeDefined();
    expect(result.completedAt).toBeInstanceOf(Date);
    expect(capturedCompletedAt).toBeInstanceOf(Date);
    // Проверяем, что completedAt установлен недавно (в пределах последних 5 секунд)
    const now = new Date();
    const timeDiff = now.getTime() - (result.completedAt as Date).getTime();
    expect(timeDiff).toBeLessThan(5000); // Меньше 5 секунд
  });

  /**
   * Тест 7: Обработка ошибки API ЮКасса (платеж не найден в ЮКасса)
   *
   * Проверяет, что если API ЮКасса возвращает ошибку 404 (платеж не найден),
   * система корректно обрабатывает эту ошибку и возвращает INTERNAL_SERVER_ERROR.
   *
   * **Валидирует: Требование 4.3**
   */
  it("обрабатывает ошибку API ЮКасса (платеж не найден)", async () => {
    const testPaymentId = randomUUID();
    const testUserId = "user_test789";
    const testWorkspaceId = "ws_test123";
    const testOrganizationId = "org_test456";
    const testYookassaId = `yookassa_${randomUUID()}`;

    const mockExistingPayment = {
      id: testPaymentId,
      yookassaId: testYookassaId,
      idempotenceKey: randomUUID(),
      userId: testUserId,
      workspaceId: testWorkspaceId,
      organizationId: testOrganizationId,
      amount: "1000.00",
      currency: "RUB" as const,
      status: "pending" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      confirmationUrl: "https://yookassa.ru/checkout/test",
      metadata: null,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      completedAt: null,
    };

    // Мокируем ошибку 404 от ЮКасса
    global.fetch = mock(async () => ({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({
        type: "error",
        id: "error_id",
        code: "not_found",
        description: "Платеж не найден",
      }),
    })) as typeof global.fetch;

    // Мокируем контекст
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
              limit: mock(async () => [mockExistingPayment]),
            })),
          })),
        })),
      },
    };

    const input = {
      paymentId: testPaymentId,
    };

    // Проверяем, что выбрасывается ошибка INTERNAL_SERVER_ERROR
    try {
      await checkStatus({
        ctx: mockContext as never,
        input,
        type: "query",
        path: "payment.checkStatus",
        getRawInput: async () => input,
      });
      expect(true).toBe(false); // Не должно дойти до этой строки
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
      expect((error as TRPCError).message).toContain("Платеж не найден");
    }
  });
});
