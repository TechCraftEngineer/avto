import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { randomUUID } from "node:crypto";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import * as fc from "fast-check";
import * as yookassaClient from "../../services/yookassa/client";

/**
 * Property-Based тесты для полноты данных платежа
 *
 * **Свойство 2: Полнота данных платежа**
 * **Валидирует: Требования 5.1, 5.2, 5.3, 5.4, 5.5**
 *
 * Эти тесты проверяют, что каждый созданный платеж содержит
 * все обязательные поля в ответе от API ЮКасса, которые затем
 * сохраняются в базе данных.
 */

describe("create payment - Data Completeness Property", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;

    // Мокируем переменные окружения
    process.env.YOOKASSA_SHOP_ID = "test-shop-id";
    process.env.YOOKASSA_SECRET_KEY = "test-secret-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * **Свойство 2: Полнота данных платежа**
   *
   * Для любого созданного платежа через YookassaClient,
   * ответ от API ЮКасса должен содержать все обязательные поля:
   * - id (yookassaId)
   * - status
   * - amount.value
   * - amount.currency
   * - created_at
   * - confirmation.confirmation_url (для redirect типа)
   *
   * Эти данные критичны для сохранения в БД согласно требованиям 5.1-5.5.
   */
  it("Property 2: все платежи содержат обязательные поля", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Генерируем случайные параметры платежа
        fc.record({
          amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          description: fc.option(fc.string({ maxLength: 128 }), {
            nil: undefined,
          }),
          metadata: fc.option(
            fc.dictionary(fc.string(), fc.string(), { maxKeys: 5 }),
            { nil: undefined },
          ),
        }),
        async (paymentParams) => {
          // Мокируем fetch для возврата полного ответа от ЮКасса
          global.fetch = mock(
            async (_url: string | URL, _options?: RequestInit) => {
              // Генерируем полный ответ с всеми обязательными полями
              const mockResponse: YookassaPaymentResponse = {
                id: `yookassa-${randomUUID()}`, // yookassaId (Требование 5.1)
                status: "pending", // status (Требование 5.1)
                amount: {
                  value: paymentParams.amount.toFixed(2), // amount (Требование 5.1)
                  currency: "RUB", // currency (Требование 5.1)
                },
                description: paymentParams.description, // description (Требование 5.5)
                confirmation: {
                  type: "redirect",
                  confirmation_url: "https://yookassa.ru/checkout/test", // confirmationUrl
                },
                created_at: new Date().toISOString(), // createdAt (Требование 5.1)
                metadata: paymentParams.metadata, // metadata
              };

              return {
                ok: true,
                json: async () => mockResponse,
              } as Response;
            },
          ) as unknown as typeof global.fetch;

          // Создаем клиент и выполняем запрос
          const client = yookassaClient.createYookassaClient();

          const result = await client.createPayment({
            amount: paymentParams.amount,
            currency: "RUB",
            description: paymentParams.description,
            returnUrl: "https://example.com/return",
            metadata: paymentParams.metadata,
          });

          // КРИТИЧЕСКИЕ ПРОВЕРКИ: все обязательные поля должны присутствовать

          // 1. yookassaId (Требование 5.1)
          expect(result.id).toBeDefined();
          expect(typeof result.id).toBe("string");
          expect(result.id.length).toBeGreaterThan(0);

          // 2. status (Требование 5.1)
          expect(result.status).toBeDefined();
          expect([
            "pending",
            "waiting_for_capture",
            "succeeded",
            "canceled",
          ]).toContain(result.status);

          // 3. amount (Требование 5.1)
          expect(result.amount).toBeDefined();
          expect(result.amount.value).toBeDefined();
          expect(typeof result.amount.value).toBe("string");
          expect(Number.parseFloat(result.amount.value)).toBeGreaterThan(0);

          // 4. currency (Требование 5.1)
          expect(result.amount.currency).toBeDefined();
          expect(typeof result.amount.currency).toBe("string");
          expect(result.amount.currency).toBe("RUB");

          // 5. created_at (Требование 5.1)
          expect(result.created_at).toBeDefined();
          expect(typeof result.created_at).toBe("string");
          // Проверяем, что это валидная ISO дата
          expect(() => new Date(result.created_at)).not.toThrow();
          expect(new Date(result.created_at).toString()).not.toBe(
            "Invalid Date",
          );

          // 6. confirmation_url (для redirect типа)
          expect(result.confirmation).toBeDefined();
          expect(result.confirmation?.type).toBe("redirect");
          expect(result.confirmation?.confirmation_url).toBeDefined();
          expect(typeof result.confirmation?.confirmation_url).toBe("string");
          // Проверяем, что это валидный URL
          expect(
            () => new URL(result.confirmation!.confirmation_url),
          ).not.toThrow();

          // 7. Дополнительная проверка: description (если передан)
          if (paymentParams.description) {
            expect(result.description).toBe(paymentParams.description);
          }

          // 8. Дополнительная проверка: metadata (если переданы)
          if (paymentParams.metadata) {
            expect(result.metadata).toBeDefined();
            expect(result.metadata).toEqual(paymentParams.metadata);
          }
        },
      ),
      {
        numRuns: 100, // Минимум 100 итераций согласно требованиям
        verbose: true,
      },
    );
  });

  /**
   * **Свойство 2 (вариация): Полнота данных при различных суммах**
   *
   * Проверяет, что все обязательные поля присутствуют независимо
   * от суммы платежа (граничные значения, большие суммы).
   */
  it("Property 2 (вариация): полнота данных для различных сумм", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Генерируем граничные и экстремальные суммы
        fc.oneof(
          fc.constant(0.01), // Минимальная сумма
          fc.constant(1.0), // Малая сумма
          fc.constant(100.0), // Средняя сумма
          fc.constant(10000.0), // Большая сумма
          fc.constant(999999.99), // Максимальная сумма
          fc.double({ min: 0.01, max: 1000000, noNaN: true }), // Случайная сумма
        ),
        async (amount) => {
          // Мокируем fetch
          global.fetch = mock(
            async (_url: string | URL, _options?: RequestInit) => {
              const mockResponse: YookassaPaymentResponse = {
                id: `yookassa-${randomUUID()}`,
                status: "pending",
                amount: {
                  value: amount.toFixed(2),
                  currency: "RUB",
                },
                confirmation: {
                  type: "redirect",
                  confirmation_url: "https://yookassa.ru/checkout/test",
                },
                created_at: new Date().toISOString(),
              };

              return {
                ok: true,
                json: async () => mockResponse,
              } as Response;
            },
          ) as unknown as typeof global.fetch;

          const client = yookassaClient.createYookassaClient();

          const result = await client.createPayment({
            amount,
            currency: "RUB",
            returnUrl: "https://example.com/return",
          });

          // Проверяем все обязательные поля
          expect(result.id).toBeDefined();
          expect(result.status).toBeDefined();
          expect(result.amount.value).toBe(amount.toFixed(2));
          expect(result.amount.currency).toBe("RUB");
          expect(result.created_at).toBeDefined();
          expect(result.confirmation?.confirmation_url).toBeDefined();
        },
      ),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  });
});
