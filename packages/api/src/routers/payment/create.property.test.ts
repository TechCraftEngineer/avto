import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { randomUUID } from "node:crypto";
import type { payment } from "@qbs-autonaim/db/schema";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import * as fc from "fast-check";
import { create } from "./create";

/**
 * Property-based тесты для процедуры создания платежа
 *
 * Используется библиотека fast-check для генерации случайных входных данных
 * и проверки универсальных свойств корректности.
 */

describe("create payment - Property-Based Tests", () => {
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
   * Свойство 2: Полнота данных платежа
   *
   * **Валидирует: Требования 5.1, 5.2, 5.3, 5.4, 5.5**
   *
   * Для любого созданного платежа в базе данных должны присутствовать
   * все обязательные поля:
   * - yookassaId
   * - idempotenceKey
   * - userId
   * - workspaceId
   * - organizationId
   * - amount
   * - currency
   * - status
   * - returnUrl
   * - createdAt
   * - updatedAt
   *
   * Тест генерирует случайные параметры платежа и проверяет,
   * что все обязательные поля присутствуют в созданном платеже.
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it("все созданные платежи содержат все обязательные поля", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Генератор случайных параметров платежа
        fc.record({
          amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 128 }), {
            nil: undefined,
          }),
          workspaceId: fc.string({ minLength: 10, maxLength: 50 }),
          organizationId: fc.string({ minLength: 10, maxLength: 50 }),
          userId: fc.string({ minLength: 10, maxLength: 50 }),
        }),
        async (testData) => {
          const testYookassaId = `yookassa_${randomUUID()}`;
          let savedPayment: {
            id: string;
            yookassaId: string;
            idempotenceKey: string;
            userId: string;
            workspaceId: string;
            organizationId: string;
            amount: string;
            currency: string;
            status: string;
            returnUrl: string;
            createdAt: Date;
            updatedAt: Date;
          } | null = null;

          // Мокируем успешный ответ от ЮКасса
          const mockYookassaResponse: YookassaPaymentResponse = {
            id: testYookassaId,
            status: "pending",
            amount: {
              value: testData.amount.toFixed(2),
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
          })) as typeof global.fetch;

          // Мокируем контекст tRPC
          const mockContext = {
            session: {
              user: {
                id: testData.userId,
                email: "test@example.com",
              },
            },
            workspaceRepository: {
              findById: mock(async (id: string) => {
                if (id === testData.workspaceId) {
                  return {
                    id: testData.workspaceId,
                    organizationId: testData.organizationId,
                    name: "Test Workspace",
                    slug: "test-workspace",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                }
                return null;
              }),
              checkAccess: mock(async (workspaceId: string, userId: string) => {
                return workspaceId === testData.workspaceId &&
                  userId === testData.userId
                  ? { workspaceId, userId, role: "member" }
                  : null;
              }),
            },
            db: {
              insert: mock((_table: typeof payment) => ({
                values: mock((data: unknown) => {
                  // Перехватываем сохраненный платеж
                  const paymentData = data as {
                    id?: string;
                    yookassaId: string;
                    idempotenceKey: string;
                    userId: string;
                    workspaceId: string;
                    organizationId: string;
                    amount: string;
                    currency: string;
                    status: string;
                    description?: string;
                    returnUrl: string;
                    confirmationUrl?: string;
                    metadata: string | null;
                    createdAt?: Date;
                    updatedAt?: Date;
                    completedAt?: Date | null;
                  };

                  savedPayment = {
                    id: randomUUID(),
                    yookassaId: paymentData.yookassaId,
                    idempotenceKey: paymentData.idempotenceKey,
                    userId: paymentData.userId,
                    workspaceId: paymentData.workspaceId,
                    organizationId: paymentData.organizationId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    status: paymentData.status,
                    returnUrl: paymentData.returnUrl,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };

                  return {
                    returning: mock(async () => [
                      {
                        ...savedPayment,
                        description: paymentData.description,
                        confirmationUrl: paymentData.confirmationUrl,
                        metadata: paymentData.metadata,
                        completedAt: null,
                      },
                    ]),
                  };
                }),
              })),
            },
          };

          // Выполняем процедуру создания платежа
          const input = {
            amount: testData.amount,
            currency: "RUB" as const,
            description: testData.description,
            returnUrl: "https://example.com/return",
            workspaceId: testData.workspaceId,
          };

          await create({
            ctx: mockContext as never,
            input,
            type: "mutation",
            path: "payment.create",
            getRawInput: async () => input,
          });

          // Проверяем полноту данных платежа
          expect(savedPayment).not.toBeNull();

          if (savedPayment) {
            // Проверяем наличие всех обязательных полей
            expect(savedPayment.yookassaId).toBeDefined();
            expect(savedPayment.yookassaId).toBe(testYookassaId);
            expect(typeof savedPayment.yookassaId).toBe("string");
            expect(savedPayment.yookassaId.length).toBeGreaterThan(0);

            expect(savedPayment.idempotenceKey).toBeDefined();
            expect(typeof savedPayment.idempotenceKey).toBe("string");
            expect(savedPayment.idempotenceKey.length).toBeGreaterThan(0);

            expect(savedPayment.userId).toBeDefined();
            expect(savedPayment.userId).toBe(testData.userId);
            expect(typeof savedPayment.userId).toBe("string");

            expect(savedPayment.workspaceId).toBeDefined();
            expect(savedPayment.workspaceId).toBe(testData.workspaceId);
            expect(typeof savedPayment.workspaceId).toBe("string");

            expect(savedPayment.organizationId).toBeDefined();
            expect(savedPayment.organizationId).toBe(testData.organizationId);
            expect(typeof savedPayment.organizationId).toBe("string");

            expect(savedPayment.amount).toBeDefined();
            expect(typeof savedPayment.amount).toBe("string");
            expect(Number.parseFloat(savedPayment.amount)).toBeGreaterThan(0);

            expect(savedPayment.currency).toBeDefined();
            expect(savedPayment.currency).toBe("RUB");
            expect(typeof savedPayment.currency).toBe("string");

            expect(savedPayment.status).toBeDefined();
            expect(savedPayment.status).toBe("pending");
            expect(typeof savedPayment.status).toBe("string");

            expect(savedPayment.returnUrl).toBeDefined();
            expect(savedPayment.returnUrl).toBe("https://example.com/return");
            expect(typeof savedPayment.returnUrl).toBe("string");

            expect(savedPayment.createdAt).toBeDefined();
            expect(savedPayment.createdAt).toBeInstanceOf(Date);

            expect(savedPayment.updatedAt).toBeDefined();
            expect(savedPayment.updatedAt).toBeInstanceOf(Date);
          }
        },
      ),
      {
        numRuns: 100, // Минимум 100 итераций
        timeout: 30000, // 30 секунд таймаут для 100 итераций
      },
    );
  });
});
