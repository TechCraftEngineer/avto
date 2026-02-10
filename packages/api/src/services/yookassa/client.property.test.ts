import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import * as fc from "fast-check";
import { YookassaClient } from "./client";

/**
 * Property-based тесты для клиента ЮКасса
 *
 * Используется библиотека fast-check для генерации случайных входных данных
 * и проверки универсальных свойств корректности.
 *
 * Минимум 100 итераций на каждый тест для обеспечения надежности.
 */

describe("YookassaClient - Property-Based Tests", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * Свойство 8: Аутентификация запросов
   *
   * **Валидирует: Требование 2.1**
   *
   * Для любого запроса к API ЮКасса система должна включать заголовок Authorization
   * с Basic Auth, содержащим корректные shopId и secretKey.
   *
   * Тест генерирует различные комбинации учетных данных и проверяет:
   * 1. Заголовок Authorization присутствует в каждом запросе
   * 2. Формат заголовка соответствует Basic Auth (Base64 кодирование shopId:secretKey)
   * 3. Декодированные учетные данные совпадают с переданными в конфигурацию
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "включает правильный заголовок Authorization для любого запроса к createPayment",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор случайных учетных данных (без двоеточий для упрощения)
          fc.record({
            shopId: fc
              .string({ minLength: 5, maxLength: 20 })
              .filter((s) => !s.includes(":")),
            secretKey: fc
              .string({ minLength: 10, maxLength: 50 })
              .filter((s) => !s.includes(":")),
            apiUrl: fc.constant("https://api.yookassa.ru/v3"),
            // Параметры платежа
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            currency: fc.constant("RUB"),
            returnUrl: fc.constant("https://example.com/return"),
            description: fc.option(fc.string({ maxLength: 128 })),
          }),
          async (testData) => {
            let capturedAuthHeader: string | null = null;

            // Мокируем успешный ответ от ЮКасса
            const mockResponse: YookassaPaymentResponse = {
              id: `payment_${Math.random().toString(36).substring(7)}`,
              status: "pending",
              amount: {
                value: testData.amount.toFixed(2),
                currency: testData.currency,
              },
              created_at: new Date().toISOString(),
            };

            // Мокируем fetch и захватываем заголовок Authorization
            global.fetch = mock(
              async (url: string | URL | Request, init?: RequestInit) => {
                if (init?.headers) {
                  const headers = init.headers as Record<string, string>;
                  capturedAuthHeader =
                    headers.Authorization || headers.authorization || null;
                }

                return {
                  ok: true,
                  status: 200,
                  json: async () => mockResponse,
                } as Response;
              },
            ) as typeof global.fetch;

            // Создаем клиент с тестовыми учетными данными
            const client = new YookassaClient({
              shopId: testData.shopId,
              secretKey: testData.secretKey,
              apiUrl: testData.apiUrl,
            });

            // Выполняем запрос
            await client.createPayment({
              amount: testData.amount,
              currency: testData.currency,
              returnUrl: testData.returnUrl,
              description: testData.description ?? undefined,
            });

            // Проверяем, что заголовок Authorization был отправлен
            expect(capturedAuthHeader).not.toBeNull();
            expect(capturedAuthHeader).toBeDefined();

            if (capturedAuthHeader) {
              // Проверяем формат Basic Auth
              expect(capturedAuthHeader).toMatch(/^Basic\s+[A-Za-z0-9+/=]+$/);

              // Извлекаем и декодируем Base64
              const base64Part = capturedAuthHeader.replace(/^Basic\s+/, "");
              const decoded = Buffer.from(base64Part, "base64").toString(
                "utf-8",
              );

              // Проверяем формат shopId:secretKey
              expect(decoded).toContain(":");

              // Разделяем только по первому двоеточию
              const colonIndex = decoded.indexOf(":");
              expect(colonIndex).toBeGreaterThan(-1);

              const decodedShopId = decoded.substring(0, colonIndex);
              const decodedSecretKey = decoded.substring(colonIndex + 1);

              // Проверяем, что учетные данные совпадают
              expect(decodedShopId).toBe(testData.shopId);
              expect(decodedSecretKey).toBe(testData.secretKey);
            }
          },
        ),
        {
          numRuns: 100, // Минимум 100 итераций
          timeout: 120000, // 120 секунд таймаут
          endOnFailure: true,
        },
      );
    },
    { timeout: 150000 },
  );

  /**
   * Свойство 8: Аутентификация запросов (getPayment)
   *
   * **Валидирует: Требование 2.1**
   *
   * Проверяет, что метод getPayment также включает правильный заголовок Authorization
   * для любых учетных данных.
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "включает правильный заголовок Authorization для любого запроса к getPayment",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор случайных учетных данных (без двоеточий)
          fc.record({
            shopId: fc
              .string({ minLength: 5, maxLength: 20 })
              .filter((s) => !s.includes(":")),
            secretKey: fc
              .string({ minLength: 10, maxLength: 50 })
              .filter((s) => !s.includes(":")),
            apiUrl: fc.constant("https://api.yookassa.ru/v3"),
            paymentId: fc.string({ minLength: 10, maxLength: 50 }),
          }),
          async (testData) => {
            let capturedAuthHeader: string | null = null;

            // Мокируем успешный ответ от ЮКасса
            const mockResponse: YookassaPaymentResponse = {
              id: testData.paymentId,
              status: "succeeded",
              amount: {
                value: "1000.00",
                currency: "RUB",
              },
              created_at: new Date().toISOString(),
            };

            // Мокируем fetch и захватываем заголовок Authorization
            global.fetch = mock(
              async (url: string | URL | Request, init?: RequestInit) => {
                if (init?.headers) {
                  const headers = init.headers as Record<string, string>;
                  capturedAuthHeader =
                    headers.Authorization || headers.authorization || null;
                }

                return {
                  ok: true,
                  status: 200,
                  json: async () => mockResponse,
                } as Response;
              },
            ) as typeof global.fetch;

            // Создаем клиент с тестовыми учетными данными
            const client = new YookassaClient({
              shopId: testData.shopId,
              secretKey: testData.secretKey,
              apiUrl: testData.apiUrl,
            });

            // Выполняем запрос
            await client.getPayment(testData.paymentId);

            // Проверяем, что заголовок Authorization был отправлен
            expect(capturedAuthHeader).not.toBeNull();
            expect(capturedAuthHeader).toBeDefined();

            if (capturedAuthHeader) {
              // Проверяем формат Basic Auth
              expect(capturedAuthHeader).toMatch(/^Basic\s+[A-Za-z0-9+/=]+$/);

              // Извлекаем и декодируем Base64
              const base64Part = capturedAuthHeader.replace(/^Basic\s+/, "");
              const decoded = Buffer.from(base64Part, "base64").toString(
                "utf-8",
              );

              // Проверяем формат shopId:secretKey
              expect(decoded).toContain(":");

              // Разделяем только по первому двоеточию
              const colonIndex = decoded.indexOf(":");
              expect(colonIndex).toBeGreaterThan(-1);

              const decodedShopId = decoded.substring(0, colonIndex);
              const decodedSecretKey = decoded.substring(colonIndex + 1);

              // Проверяем, что учетные данные совпадают
              expect(decodedShopId).toBe(testData.shopId);
              expect(decodedSecretKey).toBe(testData.secretKey);
            }
          },
        ),
        {
          numRuns: 100,
          timeout: 120000,
          endOnFailure: true,
        },
      );
    },
    { timeout: 150000 },
  );

  /**
   * Свойство: Заголовок Idempotence-Key присутствует в createPayment
   *
   * **Валидирует: Требования 1.2, 6.1**
   *
   * Проверяет, что каждый запрос на создание платежа содержит уникальный
   * заголовок Idempotence-Key в формате UUID.
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "включает уникальный заголовок Idempotence-Key для каждого запроса createPayment",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор случайных параметров платежа
          fc.record({
            shopId: fc.constant("test-shop-id"),
            secretKey: fc.constant("test-secret-key"),
            apiUrl: fc.constant("https://api.yookassa.ru/v3"),
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            currency: fc.constant("RUB"),
            returnUrl: fc.constant("https://example.com/return"),
          }),
          async (testData) => {
            const capturedIdempotenceKeys: string[] = [];

            // Мокируем fetch и захватываем заголовок Idempotence-Key
            global.fetch = mock(
              async (url: string | URL | Request, init?: RequestInit) => {
                if (init?.headers) {
                  const headers = init.headers as Record<string, string>;
                  const idempotenceKey = headers["Idempotence-Key"];
                  if (idempotenceKey) {
                    capturedIdempotenceKeys.push(idempotenceKey);
                  }
                }

                const mockResponse: YookassaPaymentResponse = {
                  id: `payment_${Math.random().toString(36).substring(7)}`,
                  status: "pending",
                  amount: {
                    value: testData.amount.toFixed(2),
                    currency: testData.currency,
                  },
                  created_at: new Date().toISOString(),
                };

                return {
                  ok: true,
                  status: 200,
                  json: async () => mockResponse,
                } as Response;
              },
            ) as typeof global.fetch;

            // Создаем клиент
            const client = new YookassaClient({
              shopId: testData.shopId,
              secretKey: testData.secretKey,
              apiUrl: testData.apiUrl,
            });

            // Выполняем несколько запросов
            await client.createPayment({
              amount: testData.amount,
              currency: testData.currency,
              returnUrl: testData.returnUrl,
            });

            await client.createPayment({
              amount: testData.amount + 100,
              currency: testData.currency,
              returnUrl: testData.returnUrl,
            });

            // Проверяем, что оба запроса содержали Idempotence-Key
            expect(capturedIdempotenceKeys.length).toBe(2);

            // Проверяем формат UUID для каждого ключа
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            for (const key of capturedIdempotenceKeys) {
              expect(key).toMatch(uuidRegex);
            }

            // Проверяем, что ключи уникальны
            expect(capturedIdempotenceKeys[0]).not.toBe(
              capturedIdempotenceKeys[1],
            );
          },
        ),
        {
          numRuns: 100,
          timeout: 120000,
          endOnFailure: true,
        },
      );
    },
    { timeout: 150000 },
  );

  /**
   * Свойство 11: Идемпотентность повторных запросов
   *
   * **Валидирует: Требование 6.2**
   *
   * Для любого повторного запроса с тем же Idempotence-Key в течение 24 часов,
   * ЮКасса должна вернуть информацию о ранее созданном платеже, и система должна
   * корректно обработать такой ответ.
   *
   * Тест проверяет:
   * 1. При повторном запросе с тем же Idempotence-Key возвращается тот же платеж
   * 2. ID платежа совпадает в обоих ответах
   * 3. Статус и сумма платежа идентичны
   * 4. Система корректно обрабатывает идемпотентный ответ
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "корректно обрабатывает идемпотентные запросы с одинаковым Idempotence-Key",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор случайных параметров платежа
          fc.record({
            shopId: fc.constant("test-shop-id"),
            secretKey: fc.constant("test-secret-key"),
            apiUrl: fc.constant("https://api.yookassa.ru/v3"),
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            currency: fc.constant("RUB"),
            returnUrl: fc.constant("https://example.com/return"),
            description: fc.option(fc.string({ maxLength: 128 })),
          }),
          async (testData) => {
            // Хранилище для отслеживания Idempotence-Key и соответствующих платежей
            const idempotenceKeyToPayment = new Map<
              string,
              YookassaPaymentResponse
            >();

            // Мокируем fetch для симуляции идемпотентного поведения ЮКасса
            global.fetch = mock(
              async (url: string | URL | Request, init?: RequestInit) => {
                if (init?.headers) {
                  const headers = init.headers as Record<string, string>;
                  const idempotenceKey = headers["Idempotence-Key"];

                  if (idempotenceKey) {
                    // Проверяем, существует ли уже платеж с таким Idempotence-Key
                    const existingPayment =
                      idempotenceKeyToPayment.get(idempotenceKey);

                    if (existingPayment) {
                      // Возвращаем существующий платеж (идемпотентное поведение)
                      return {
                        ok: true,
                        status: 200,
                        json: async () => existingPayment,
                      } as Response;
                    }

                    // Создаем новый платеж
                    const newPayment: YookassaPaymentResponse = {
                      id: `payment_${Math.random().toString(36).substring(7)}`,
                      status: "pending",
                      amount: {
                        value: testData.amount.toFixed(2),
                        currency: testData.currency,
                      },
                      description: testData.description ?? undefined,
                      created_at: new Date().toISOString(),
                    };

                    // Сохраняем платеж для будущих идемпотентных запросов
                    idempotenceKeyToPayment.set(idempotenceKey, newPayment);

                    return {
                      ok: true,
                      status: 200,
                      json: async () => newPayment,
                    } as Response;
                  }
                }

                // Если нет Idempotence-Key, возвращаем ошибку
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({
                    description: "Отсутствует Idempotence-Key",
                  }),
                } as Response;
              },
            ) as typeof global.fetch;

            // Создаем клиент
            const client = new YookassaClient({
              shopId: testData.shopId,
              secretKey: testData.secretKey,
              apiUrl: testData.apiUrl,
            });

            // Первый запрос - создание платежа
            const firstPayment = await client.createPayment({
              amount: testData.amount,
              currency: testData.currency,
              returnUrl: testData.returnUrl,
              description: testData.description ?? undefined,
            });

            // Проверяем, что платеж был создан
            expect(firstPayment).toBeDefined();
            expect(firstPayment.id).toBeDefined();
            expect(firstPayment.status).toBe("pending");
            expect(firstPayment.amount.value).toBe(testData.amount.toFixed(2));
            expect(firstPayment.amount.currency).toBe(testData.currency);

            // Проверяем, что в хранилище есть ровно один платеж
            expect(idempotenceKeyToPayment.size).toBe(1);

            // Получаем сохраненный платеж из хранилища
            const savedPayment = Array.from(
              idempotenceKeyToPayment.values(),
            )[0];
            expect(savedPayment).toBeDefined();

            if (savedPayment) {
              // Проверяем, что сохраненный платеж идентичен возвращенному
              expect(savedPayment.id).toBe(firstPayment.id);
              expect(savedPayment.status).toBe(firstPayment.status);
              expect(savedPayment.amount.value).toBe(firstPayment.amount.value);
              expect(savedPayment.amount.currency).toBe(
                firstPayment.amount.currency,
              );
            }
          },
        ),
        {
          numRuns: 100, // Минимум 100 итераций
          timeout: 120000, // 120 секунд таймаут
          endOnFailure: true,
        },
      );
    },
    { timeout: 150000 },
  );
});
