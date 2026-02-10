import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { randomUUID } from "node:crypto";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import * as fc from "fast-check";
import * as yookassaClient from "../../services/yookassa/client";

/**
 * Property-Based тесты для процедуры создания платежа
 *
 * **Свойство 1: Уникальность ключа идемпотентности**
 * **Валидирует: Требования 1.2, 5.7, 6.1, 6.3**
 *
 * Эти тесты проверяют, что каждый создаваемый платеж получает уникальный
 * idempotenceKey, что критично для обеспечения идемпотентности операций.
 */

describe("create payment - Property-Based Tests", () => {
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
   * **Свойство 1: Уникальность ключа идемпотентности**
   *
   * Для любого множества создаваемых платежей через YookassaClient,
   * каждый запрос должен содержать уникальный Idempotence-Key в заголовках.
   *
   * Этот тест проверяет, что randomUUID() генерирует уникальные ключи
   * при множественных вызовах createPayment.
   */
  it("Property 1: каждый платеж получает уникальный idempotenceKey", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Генерируем массив параметров для создания платежей
        fc.array(
          fc.record({
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            description: fc.option(fc.string({ maxLength: 128 }), {
              nil: undefined,
            }),
          }),
          { minLength: 2, maxLength: 20 },
        ),
        async (paymentParams) => {
          const capturedIdempotenceKeys: string[] = [];

          // Мокируем fetch для перехвата Idempotence-Key из заголовков
          global.fetch = mock(
            async (_url: string | URL, options?: RequestInit) => {
              // Захватываем Idempotence-Key из заголовков
              const headers = options?.headers as Record<string, string>;
              if (headers?.["Idempotence-Key"]) {
                capturedIdempotenceKeys.push(headers["Idempotence-Key"]);
              }

              // Возвращаем успешный мок-ответ
              const mockResponse: YookassaPaymentResponse = {
                id: `yookassa-${randomUUID()}`,
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

              return {
                ok: true,
                json: async () => mockResponse,
              } as Response;
            },
          ) as typeof global.fetch;

          // Создаем клиент и выполняем запросы
          const client = yookassaClient.createYookassaClient();

          for (const params of paymentParams) {
            try {
              await client.createPayment({
                amount: params.amount,
                currency: "RUB",
                description: params.description,
                returnUrl: "https://example.com/return",
              });
            } catch (_error) {
              // Игнорируем ошибки, фокусируемся на захвате ключей
            }
          }

          // КРИТИЧЕСКАЯ ПРОВЕРКА: все захваченные ключи должны быть уникальными
          const uniqueKeys = new Set(capturedIdempotenceKeys);
          expect(uniqueKeys.size).toBe(capturedIdempotenceKeys.length);

          // Дополнительная проверка: все ключи должны быть валидными UUID v4
          for (const key of capturedIdempotenceKeys) {
            expect(key).toMatch(
              /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            );
          }

          // Проверка: количество захваченных ключей должно соответствовать количеству запросов
          expect(capturedIdempotenceKeys.length).toBe(paymentParams.length);
        },
      ),
      {
        numRuns: 100, // Минимум 100 итераций согласно требованиям
        verbose: true,
      },
    );
  });

  /**
   * **Свойство 1 (стресс-тест): Уникальность при большом количестве платежей**
   *
   * Проверяет уникальность idempotenceKey при создании большого количества
   * платежей подряд (до 100 платежей за один тест).
   */
  it("Property 1 (stress): idempotenceKey уникальны при большом количестве платежей", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }),
        async (numPayments) => {
          const capturedKeys: string[] = [];

          global.fetch = mock(
            async (_url: string | URL, options?: RequestInit) => {
              const headers = options?.headers as Record<string, string>;
              if (headers?.["Idempotence-Key"]) {
                capturedKeys.push(headers["Idempotence-Key"]);
              }

              const mockResponse: YookassaPaymentResponse = {
                id: `yookassa-${randomUUID()}`,
                status: "pending",
                amount: { value: "1000.00", currency: "RUB" },
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
          ) as typeof global.fetch;

          const client = yookassaClient.createYookassaClient();

          // Создаем указанное количество платежей
          for (let i = 0; i < numPayments; i++) {
            await client.createPayment({
              amount: 1000 + i,
              currency: "RUB",
              description: `Payment ${i}`,
              returnUrl: "https://example.com/return",
            });
          }

          // Проверяем уникальность
          const uniqueKeys = new Set(capturedKeys);
          expect(uniqueKeys.size).toBe(numPayments);
          expect(capturedKeys.length).toBe(numPayments);

          // Проверяем отсутствие дубликатов
          const duplicates = capturedKeys.filter(
            (key, index) => capturedKeys.indexOf(key) !== index,
          );
          expect(duplicates).toEqual([]);
        },
      ),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  });

  /**
   * **Свойство 1 (параллельность): Уникальность при параллельном создании**
   *
   * Проверяет, что даже при параллельном создании множества платежей
   * все idempotenceKey остаются уникальными.
   */
  it("Property 1 (parallel): idempotenceKey уникальны при параллельном создании", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 5, max: 30 }), async (numPayments) => {
        const _capturedKeys: string[] = [];
        const keyLock = { keys: [] as string[] };

        global.fetch = mock(
          async (_url: string | URL, options?: RequestInit) => {
            const headers = options?.headers as Record<string, string>;
            if (headers?.["Idempotence-Key"]) {
              // Используем синхронный push для сбора ключей
              keyLock.keys.push(headers["Idempotence-Key"]);
            }

            const mockResponse: YookassaPaymentResponse = {
              id: `yookassa-${randomUUID()}`,
              status: "pending",
              amount: { value: "1000.00", currency: "RUB" },
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
        ) as typeof global.fetch;

        const client = yookassaClient.createYookassaClient();

        // Создаем платежи параллельно
        const promises = Array.from({ length: numPayments }, (_, i) =>
          client.createPayment({
            amount: 1000 + i,
            currency: "RUB",
            description: `Parallel payment ${i}`,
            returnUrl: "https://example.com/return",
          }),
        );

        await Promise.all(promises);

        // Проверяем уникальность всех собранных ключей
        const uniqueKeys = new Set(keyLock.keys);
        expect(uniqueKeys.size).toBe(numPayments);
        expect(keyLock.keys.length).toBe(numPayments);
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  });
});
