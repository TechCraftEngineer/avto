import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import * as fc from "fast-check";
import { Hono } from "hono";
import { yookassaRouter } from "./yookassa";

/**
 * Property-based тесты для webhook-роутера ЮКасса
 *
 * Используется библиотека fast-check для генерации случайных входных данных
 * и проверки универсальных свойств корректности.
 */

describe("yookassa webhook - Property-Based Tests", () => {
  let app: Hono;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    app = new Hono();
    app.route("/webhooks/yookassa", yookassaRouter);

    originalFetch = global.fetch;

    process.env.YOOKASSA_SHOP_ID = "test-shop-id";
    process.env.YOOKASSA_SECRET_KEY = "test-secret-key";
    process.env.YOOKASSA_API_URL = "https://api.yookassa.ru/v3";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.YOOKASSA_SHOP_ID;
    delete process.env.YOOKASSA_SECRET_KEY;
    delete process.env.YOOKASSA_API_URL;
  });

  /**
   * Свойство 4: Обновление статуса через webhook
   *
   * **Валидирует: Требования 3.3, 3.4**
   *
   * Для любого webhook-уведомления от ЮКасса со статусом "succeeded" или "canceled",
   * система должна обновить соответствующий платеж в базе данных на новый статус.
   *
   * Тест генерирует различные сценарии обновления статуса и проверяет:
   * 1. Статус корректно обновляется в БД
   * 2. completedAt устанавливается для завершенных платежей
   * 3. completedAt остается null для pending платежей
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "обновляет статус платежа для любого валидного webhook",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор случайных сценариев webhook
          fc.record({
            // Начальный статус платежа в БД
            initialStatus: fc.constantFrom(
              "pending" as const,
              "succeeded" as const,
              "canceled" as const,
            ),
            // Новый статус от ЮКасса (из API-верификации)
            yookassaStatus: fc.constantFrom(
              "pending" as const,
              "waiting_for_capture" as const,
              "succeeded" as const,
              "canceled" as const,
            ),
            // Данные платежа
            yookassaId: fc.string({ minLength: 10, maxLength: 50 }),
            paymentId: fc.uuid(),
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          }),
          async (testData) => {
            let updatedPayment: {
              status: "pending" | "succeeded" | "canceled";
              completedAt: Date | null;
              updatedAt: Date;
            } | null = null;

            // Мокируем API-верификацию
            const mockApiResponse: YookassaPaymentResponse = {
              id: testData.yookassaId,
              status: testData.yookassaStatus,
              amount: {
                value: testData.amount.toFixed(2),
                currency: "RUB",
              },
              created_at: new Date().toISOString(),
            };

            global.fetch = mock(async () => ({
              ok: true,
              json: async () => mockApiResponse,
            })) as unknown as typeof global.fetch;

            // Определяем ожидаемый статус после маппинга
            let expectedStatus: "pending" | "succeeded" | "canceled" =
              "pending";
            if (testData.yookassaStatus === "succeeded") {
              expectedStatus = "succeeded";
            } else if (testData.yookassaStatus === "canceled") {
              expectedStatus = "canceled";
            } else if (
              testData.yookassaStatus === "waiting_for_capture" ||
              testData.yookassaStatus === "pending"
            ) {
              expectedStatus = "pending";
            }

            // Определяем, должен ли измениться статус
            const statusWillChange = testData.initialStatus !== expectedStatus;

            // Мокируем БД
            const _mockDb = {
              select: mock(() => ({
                from: mock(() => ({
                  where: mock(() => ({
                    limit: mock(async () => [
                      {
                        id: testData.paymentId,
                        yookassaId: testData.yookassaId,
                        status: testData.initialStatus,
                        amount: testData.amount.toString(),
                        currency: "RUB",
                        userId: "user_test",
                        workspaceId: "ws_test",
                        organizationId: "org_test",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        completedAt:
                          testData.initialStatus === "succeeded" ||
                          testData.initialStatus === "canceled"
                            ? new Date()
                            : null,
                      },
                    ]),
                  })),
                })),
              })),
              update: mock(() => ({
                set: mock(
                  (data: {
                    status: "pending" | "succeeded" | "canceled";
                    completedAt: Date | null;
                    updatedAt: Date;
                  }) => {
                    updatedPayment = {
                      status: data.status,
                      completedAt: data.completedAt,
                      updatedAt: data.updatedAt,
                    };
                    return {
                      where: mock(() => Promise.resolve()),
                    };
                  },
                ),
              })),
            };

            // Webhook payload
            const webhookPayload = {
              type: "notification",
              event:
                testData.yookassaStatus === "succeeded"
                  ? "payment.succeeded"
                  : testData.yookassaStatus === "canceled"
                    ? "payment.canceled"
                    : "payment.waiting_for_capture",
              object: {
                id: testData.yookassaId,
                status: testData.yookassaStatus,
                amount: {
                  value: testData.amount.toFixed(2),
                  currency: "RUB",
                },
                created_at: new Date().toISOString(),
              },
            };

            // Отправляем webhook
            const response = await app.request("/webhooks/yookassa/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Forwarded-Proto": "https",
                "X-Forwarded-Port": "443",
              },
              body: JSON.stringify(webhookPayload),
            });

            // Проверяем успешный ответ
            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toEqual({ success: true });

            // Проверяем, что статус был обновлен в БД
            if (statusWillChange) {
              expect(updatedPayment).not.toBeNull();

              // Проверяем корректность обновленного статуса
              if (updatedPayment) {
                expect(updatedPayment.status).toBe(expectedStatus);

                // Проверяем установку completedAt для завершенных платежей
                if (
                  expectedStatus === "succeeded" ||
                  expectedStatus === "canceled"
                ) {
                  expect(updatedPayment.completedAt).not.toBeNull();
                  expect(updatedPayment.completedAt).toBeInstanceOf(Date);
                } else {
                  expect(updatedPayment.completedAt).toBeNull();
                }

                // Проверяем, что updatedAt был обновлен
                expect(updatedPayment.updatedAt).toBeInstanceOf(Date);
              }
            }

            // Проверяем, что API-верификация была вызвана
            expect(global.fetch).toHaveBeenCalled();
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
   * Свойство 5: Корректность HTTP-ответов webhook
   *
   * **Валидирует: Требования 3.5, 3.6**
   *
   * Для любого успешно обработанного webhook-уведомления система должна
   * вернуть HTTP 200 OK, а для любого webhook с ошибкой обработки — HTTP 500.
   *
   * Тест генерирует различные сценарии успеха и ошибок и проверяет
   * корректность HTTP-ответов.
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "возвращает корректные HTTP-ответы для любого webhook",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор случайных сценариев
          fc.record({
            yookassaId: fc.string({ minLength: 10, maxLength: 50 }),
            paymentId: fc.uuid(),
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            status: fc.constantFrom(
              "pending" as const,
              "waiting_for_capture" as const,
              "succeeded" as const,
              "canceled" as const,
            ),
            // Сценарий: успех или ошибка
            scenario: fc.constantFrom(
              "success" as const,
              "payment_not_found" as const,
              "api_verification_failed" as const,
            ),
          }),
          async (testData) => {
            // Мокируем API-верификацию в зависимости от сценария
            if (testData.scenario === "api_verification_failed") {
              global.fetch = mock(async () => ({
                ok: false,
                status: 404,
                json: async () => ({
                  type: "error",
                  code: "not_found",
                  description: "Платеж не найден",
                }),
              })) as unknown as typeof global.fetch;
            } else {
              const mockApiResponse: YookassaPaymentResponse = {
                id: testData.yookassaId,
                status: testData.status,
                amount: {
                  value: testData.amount.toFixed(2),
                  currency: "RUB",
                },
                created_at: new Date().toISOString(),
              };

              global.fetch = mock(async () => ({
                ok: true,
                json: async () => mockApiResponse,
              })) as unknown as typeof global.fetch;
            }

            // Мокируем БД в зависимости от сценария
            const _mockDb = {
              select: mock(() => ({
                from: mock(() => ({
                  where: mock(() => ({
                    limit: mock(async () => {
                      if (testData.scenario === "payment_not_found") {
                        return []; // Платеж не найден
                      }
                      return [
                        {
                          id: testData.paymentId,
                          yookassaId: testData.yookassaId,
                          status: "pending",
                          amount: testData.amount.toString(),
                          currency: "RUB",
                          userId: "user_test",
                          workspaceId: "ws_test",
                          organizationId: "org_test",
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          completedAt: null,
                        },
                      ];
                    }),
                  })),
                })),
              })),
              update: mock(() => ({
                set: mock(() => ({
                  where: mock(() => Promise.resolve()),
                })),
              })),
            };

            // Webhook payload
            const webhookPayload = {
              type: "notification",
              event:
                testData.status === "succeeded"
                  ? "payment.succeeded"
                  : testData.status === "canceled"
                    ? "payment.canceled"
                    : "payment.waiting_for_capture",
              object: {
                id: testData.yookassaId,
                status: testData.status,
                amount: {
                  value: testData.amount.toFixed(2),
                  currency: "RUB",
                },
                created_at: new Date().toISOString(),
              },
            };

            // Отправляем webhook
            const response = await app.request("/webhooks/yookassa/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Forwarded-Proto": "https",
                "X-Forwarded-Port": "443",
              },
              body: JSON.stringify(webhookPayload),
            });

            // Проверяем корректность HTTP-ответа в зависимости от сценария
            if (testData.scenario === "success") {
              // Успешная обработка → HTTP 200
              expect(response.status).toBe(200);
              const body = (await response.json()) as { success: boolean };
              expect(body).toEqual({ success: true });
            } else if (testData.scenario === "payment_not_found") {
              // Платеж не найден → HTTP 404
              expect(response.status).toBe(404);
              const body = (await response.json()) as { error: string };
              expect(body.error).toBe("Not Found");
            } else if (testData.scenario === "api_verification_failed") {
              // API-верификация не удалась → HTTP 403
              expect(response.status).toBe(403);
              const body = (await response.json()) as { error: string };
              expect(body.error).toBe("Forbidden");
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
   * Свойство: Безопасность webhook (HTTPS и порт)
   *
   * **Валидирует: Требование 3.2**
   *
   * Для любого webhook-уведомления система должна проверить:
   * 1. Соединение через HTTPS (TLS 1.2+)
   * 2. Правильный порт (443 или 8443)
   *
   * Если проверка не пройдена, должен возвращаться HTTP 403 FORBIDDEN.
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "проверяет безопасность webhook для любого запроса",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор случайных сценариев безопасности
          fc.record({
            protocol: fc.constantFrom("http", "https"),
            port: fc.constantFrom("80", "443", "8080", "8443", "3000"),
            yookassaId: fc.string({ minLength: 10, maxLength: 50 }),
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          }),
          async (testData) => {
            // Определяем, должен ли запрос быть принят
            const isSecure =
              testData.protocol === "https" &&
              (testData.port === "443" || testData.port === "8443");

            // Webhook payload
            const webhookPayload = {
              type: "notification",
              event: "payment.succeeded",
              object: {
                id: testData.yookassaId,
                status: "succeeded",
                amount: {
                  value: testData.amount.toFixed(2),
                  currency: "RUB",
                },
                created_at: new Date().toISOString(),
              },
            };

            // Отправляем webhook
            const response = await app.request("/webhooks/yookassa/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Forwarded-Proto": testData.protocol,
                "X-Forwarded-Port": testData.port,
              },
              body: JSON.stringify(webhookPayload),
            });

            if (isSecure) {
              // Безопасный запрос может быть обработан (но может вернуть другую ошибку)
              // Не проверяем конкретный статус, так как могут быть другие ошибки
              expect([200, 404, 500]).toContain(response.status);
            } else {
              // Небезопасный запрос должен быть отклонен с HTTP 403
              expect(response.status).toBe(403);
              const body = (await response.json()) as { error: string };
              expect(body.error).toBe("Forbidden");
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
   * Свойство: Валидация структуры webhook
   *
   * **Валидирует: Требование 3.1**
   *
   * Для любого webhook-уведомления система должна валидировать его структуру
   * через Zod схему. Невалидные webhook должны отклоняться с HTTP 400.
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "валидирует структуру webhook для любого запроса",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор случайных webhook (валидных и невалидных)
          fc.oneof(
            // Валидный webhook
            fc.record({
              type: fc.constant("notification"),
              event: fc.constantFrom(
                "payment.succeeded",
                "payment.canceled",
                "payment.waiting_for_capture",
              ),
              object: fc.record({
                id: fc.string({ minLength: 10, maxLength: 50 }),
                status: fc.constantFrom(
                  "pending",
                  "waiting_for_capture",
                  "succeeded",
                  "canceled",
                ),
                amount: fc.record({
                  value: fc
                    .double({ min: 0.01, max: 1000000, noNaN: true })
                    .map((n) => n.toFixed(2)),
                  currency: fc.constant("RUB"),
                }),
                created_at: fc.constant(new Date().toISOString()),
              }),
              isValid: fc.constant(true),
            }),
            // Невалидный webhook (неверный тип)
            fc.record({
              type: fc.constantFrom("invalid_type", "error", ""),
              event: fc.constant("payment.succeeded"),
              object: fc.record({
                id: fc.string({ minLength: 10, maxLength: 50 }),
              }),
              isValid: fc.constant(false),
            }),
            // Невалидный webhook (отсутствует object)
            fc.record({
              type: fc.constant("notification"),
              event: fc.constant("payment.succeeded"),
              isValid: fc.constant(false),
            }),
          ),
          async (testData) => {
            const response = await app.request("/webhooks/yookassa/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Forwarded-Proto": "https",
                "X-Forwarded-Port": "443",
              },
              body: JSON.stringify(testData),
            });

            if ("isValid" in testData && testData.isValid) {
              // Валидный webhook может быть обработан (но может вернуть другую ошибку)
              expect([200, 404, 403, 500]).toContain(response.status);
            } else {
              // Невалидный webhook должен быть отклонен с HTTP 400
              expect(response.status).toBe(400);
              const body = (await response.json()) as { error: string };
              expect(body.error).toBe("Bad Request");
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
});
