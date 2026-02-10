import { describe, expect, it } from "bun:test";
import {
  yookassaPaymentResponseSchema,
  yookassaWebhookSchema,
} from "@qbs-autonaim/validators";
import * as fc from "fast-check";
import type { ZodError } from "zod";

/**
 * Property-based тесты для валидации ответов API
 *
 * **Свойство 10: Валидация ответов API**
 * **Валидирует: Требования 10.3, 10.4**
 *
 * Эти тесты проверяют, что система корректно валидирует ответы от API ЮКасса
 * через Zod схемы, принимает валидные ответы и отклоняет невалидные.
 */

describe("payment validation - API Response Validation Property-Based Tests", () => {
  /**
   * Свойство 10: Валидация ответов API
   *
   * Для любого ответа от API ЮКасса система должна валидировать его структуру
   * с помощью Zod схем, и отклонять невалидные ответы.
   *
   * Проверяется:
   * - Валидные ответы проходят валидацию
   * - Невалидные ответы отклоняются
   * - Отсутствующие обязательные поля обнаруживаются
   * - Неверные типы данных обнаруживаются
   *
   * **Валидирует: Требования 10.3, 10.4**
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "принимает валидные ответы от API ЮКасса",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор валидных ответов от API ЮКасса
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 50 }),
            status: fc.constantFrom(
              "pending" as const,
              "waiting_for_capture" as const,
              "succeeded" as const,
              "canceled" as const,
            ),
            amount: fc.record({
              value: fc
                .double({ min: 0.01, max: 1000000, noNaN: true })
                .map((n) => n.toFixed(2)),
              currency: fc.constant("RUB"),
            }),
            description: fc.option(
              fc.string({ minLength: 1, maxLength: 128 }),
              { nil: undefined },
            ),
            confirmation: fc.option(
              fc.record({
                type: fc.constant("redirect" as const),
                confirmation_url: fc.constant(
                  "https://yookassa.ru/checkout/test",
                ),
              }),
              { nil: undefined },
            ),
            created_at: fc.constant(new Date().toISOString()),
            metadata: fc.option(
              fc.dictionary(fc.string(), fc.string(), { maxKeys: 5 }),
              { nil: undefined },
            ),
          }),
          async (validResponse) => {
            const result =
              yookassaPaymentResponseSchema.safeParse(validResponse);

            // КРИТИЧЕСКАЯ ПРОВЕРКА: валидация должна пройти успешно
            expect(result.success).toBe(true);

            if (result.success) {
              // Проверяем, что все обязательные поля присутствуют
              expect(result.data.id).toBeDefined();
              expect(result.data.status).toBeDefined();
              expect(result.data.amount).toBeDefined();
              expect(result.data.amount.value).toBeDefined();
              expect(result.data.amount.currency).toBeDefined();
              expect(result.data.created_at).toBeDefined();

              // Проверяем типы данных
              expect(typeof result.data.id).toBe("string");
              expect(typeof result.data.status).toBe("string");
              expect(typeof result.data.amount.value).toBe("string");
              expect(typeof result.data.amount.currency).toBe("string");
              expect(typeof result.data.created_at).toBe("string");

              // Проверяем, что created_at является валидной ISO датой
              expect(() => new Date(result.data.created_at)).not.toThrow();
              expect(new Date(result.data.created_at).toString()).not.toBe(
                "Invalid Date",
              );
            }
          },
        ),
        {
          numRuns: 100, // Минимум 100 итераций
          timeout: 60000,
          endOnFailure: true,
        },
      );
    },
    { timeout: 90000 },
  );

  /**
   * Свойство 10 (вариация): Отклонение невалидных ответов API
   *
   * Проверяет, что невалидные ответы от API ЮКасса отклоняются
   * с ошибкой валидации.
   *
   * **Валидирует: Требования 10.3, 10.4**
   */
  it(
    "отклоняет невалидные ответы от API ЮКасса",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор невалидных ответов
          fc.oneof(
            // Отсутствует обязательное поле id
            fc.record({
              status: fc.constant("pending" as const),
              amount: fc.record({
                value: fc.constant("1000.00"),
                currency: fc.constant("RUB"),
              }),
              created_at: fc.constant(new Date().toISOString()),
            }),
            // Отсутствует обязательное поле status
            fc.record({
              id: fc.string({ minLength: 10 }),
              amount: fc.record({
                value: fc.constant("1000.00"),
                currency: fc.constant("RUB"),
              }),
              created_at: fc.constant(new Date().toISOString()),
            }),
            // Отсутствует обязательное поле amount
            fc.record({
              id: fc.string({ minLength: 10 }),
              status: fc.constant("pending" as const),
              created_at: fc.constant(new Date().toISOString()),
            }),
            // Неверный статус
            fc.record({
              id: fc.string({ minLength: 10 }),
              status: fc.constantFrom("invalid", "unknown", ""),
              amount: fc.record({
                value: fc.constant("1000.00"),
                currency: fc.constant("RUB"),
              }),
              created_at: fc.constant(new Date().toISOString()),
            }),
            // Неверная структура amount
            fc.record({
              id: fc.string({ minLength: 10 }),
              status: fc.constant("pending" as const),
              amount: fc.oneof(
                fc.constant("1000.00"), // Строка вместо объекта
                fc.constant(1000), // Число вместо объекта
                fc.record({ value: fc.constant("1000.00") }), // Отсутствует currency
              ),
              created_at: fc.constant(new Date().toISOString()),
            }),
            // Неверный тип confirmation
            fc.record({
              id: fc.string({ minLength: 10 }),
              status: fc.constant("pending" as const),
              amount: fc.record({
                value: fc.constant("1000.00"),
                currency: fc.constant("RUB"),
              }),
              confirmation: fc.record({
                type: fc.constantFrom("invalid", "qr", ""),
                confirmation_url: fc.constant(
                  "https://yookassa.ru/checkout/test",
                ),
              }),
              created_at: fc.constant(new Date().toISOString()),
            }),
          ),
          async (invalidResponse) => {
            const result =
              yookassaPaymentResponseSchema.safeParse(invalidResponse);

            // КРИТИЧЕСКАЯ ПРОВЕРКА: валидация должна провалиться
            expect(result.success).toBe(false);

            if (!result.success) {
              const error = result.error as ZodError;

              // Должны быть ошибки валидации
              expect(error.errors).toBeDefined();
              expect(error.errors.length).toBeGreaterThan(0);

              // Каждая ошибка должна иметь сообщение и путь
              for (const err of error.errors) {
                expect(err.message).toBeDefined();
                expect(typeof err.message).toBe("string");
                expect(err.path).toBeDefined();
                expect(Array.isArray(err.path)).toBe(true);
              }
            }
          },
        ),
        {
          numRuns: 100,
          timeout: 60000,
        },
      );
    },
    { timeout: 90000 },
  );

  /**
   * Свойство 10 (вариация): Валидация webhook-уведомлений
   *
   * Проверяет, что валидные webhook-уведомления проходят валидацию,
   * а невалидные отклоняются.
   *
   * **Валидирует: Требования 10.4**
   */
  it(
    "корректно валидирует webhook-уведомления",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // true = валидный, false = невалидный
          async (isValid) => {
            let webhookData: unknown;

            if (isValid) {
              // Генерируем валидный webhook
              webhookData = {
                type: "notification",
                event: fc.sample(
                  fc.constantFrom(
                    "payment.succeeded",
                    "payment.canceled",
                    "payment.waiting_for_capture",
                  ),
                  1,
                )[0],
                object: {
                  id: fc.sample(
                    fc.string({ minLength: 10, maxLength: 50 }),
                    1,
                  )[0],
                  status: fc.sample(
                    fc.constantFrom(
                      "pending",
                      "succeeded",
                      "canceled",
                      "waiting_for_capture",
                    ),
                    1,
                  )[0],
                  amount: {
                    value: "1000.00",
                    currency: "RUB",
                  },
                  created_at: new Date().toISOString(),
                },
              };
            } else {
              // Генерируем невалидный webhook
              const invalidType = fc.sample(
                fc.oneof(
                  // Неверный тип
                  fc.record({
                    type: fc.constantFrom("invalid", "wrong"),
                    event: fc.constant("payment.succeeded"),
                    object: fc.record({
                      id: fc.string({ minLength: 10 }),
                      status: fc.constant("succeeded" as const),
                      amount: fc.record({
                        value: fc.constant("1000.00"),
                        currency: fc.constant("RUB"),
                      }),
                      created_at: fc.constant(new Date().toISOString()),
                    }),
                  }),
                  // Отсутствует object
                  fc.record({
                    type: fc.constant("notification" as const),
                    event: fc.constant("payment.succeeded"),
                  }),
                  // Неверный event
                  fc.record({
                    type: fc.constant("notification" as const),
                    event: fc.constantFrom("invalid.event", "payment.unknown"),
                    object: fc.record({
                      id: fc.string({ minLength: 10 }),
                      status: fc.constant("succeeded" as const),
                      amount: fc.record({
                        value: fc.constant("1000.00"),
                        currency: fc.constant("RUB"),
                      }),
                      created_at: fc.constant(new Date().toISOString()),
                    }),
                  }),
                ),
                1,
              )[0];

              webhookData = invalidType;
            }

            const result = yookassaWebhookSchema.safeParse(webhookData);

            // Проверяем соответствие ожиданиям
            if (isValid) {
              expect(result.success).toBe(true);
              if (result.success) {
                expect(result.data.type).toBe("notification");
                expect(result.data.event).toBeDefined();
                expect(result.data.object).toBeDefined();
                expect(result.data.object.id).toBeDefined();
                expect(result.data.object.status).toBeDefined();
              }
            } else {
              expect(result.success).toBe(false);
              if (!result.success) {
                expect(result.error.errors.length).toBeGreaterThan(0);
              }
            }
          },
        ),
        {
          numRuns: 100,
          timeout: 60000,
        },
      );
    },
    { timeout: 90000 },
  );

  /**
   * Свойство 10 (edge case): Валидация типов данных в ответах
   *
   * Проверяет, что схемы корректно проверяют типы данных полей
   * и отклоняют неверные типы.
   *
   * **Валидирует: Требования 10.3**
   */
  it(
    "отклоняет ответы с неверными типами данных",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // id как число вместо строки
            fc.record({
              id: fc.integer({ min: 1, max: 999999 }),
              status: fc.constant("pending" as const),
              amount: fc.record({
                value: fc.constant("1000.00"),
                currency: fc.constant("RUB"),
              }),
              created_at: fc.constant(new Date().toISOString()),
            }),
            // amount.value как число вместо строки
            fc.record({
              id: fc.string({ minLength: 10 }),
              status: fc.constant("pending" as const),
              amount: fc.record({
                value: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
                currency: fc.constant("RUB"),
              }),
              created_at: fc.constant(new Date().toISOString()),
            }),
            // created_at как Date вместо строки
            fc.record({
              id: fc.string({ minLength: 10 }),
              status: fc.constant("pending" as const),
              amount: fc.record({
                value: fc.constant("1000.00"),
                currency: fc.constant("RUB"),
              }),
              created_at: fc.date(),
            }),
          ),
          async (invalidResponse) => {
            const result =
              yookassaPaymentResponseSchema.safeParse(invalidResponse);

            // Должна провалиться валидация из-за неверных типов
            expect(result.success).toBe(false);

            if (!result.success) {
              const error = result.error as ZodError;
              expect(error.errors.length).toBeGreaterThan(0);

              // Проверяем, что ошибка связана с типом данных
              const hasTypeError = error.errors.some(
                (err) =>
                  err.code === "invalid_type" ||
                  err.message.toLowerCase().includes("expected") ||
                  err.message.toLowerCase().includes("type"),
              );
              expect(hasTypeError).toBe(true);
            }
          },
        ),
        {
          numRuns: 100,
          timeout: 60000,
        },
      );
    },
    { timeout: 90000 },
  );

  /**
   * Свойство 10 (edge case): Валидация опциональных полей
   *
   * Проверяет, что опциональные поля (description, confirmation, metadata)
   * корректно обрабатываются - их отсутствие не вызывает ошибок,
   * но их наличие с неверными данными вызывает ошибки.
   *
   * **Валидирует: Требования 10.3**
   */
  it(
    "корректно обрабатывает опциональные поля",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // true = с опциональными полями, false = без них
          fc.boolean(), // true = валидные опциональные поля, false = невалидные
          async (withOptional, validOptional) => {
            let responseData: unknown;

            const baseData = {
              id: fc.sample(fc.string({ minLength: 10, maxLength: 50 }), 1)[0],
              status: "pending" as const,
              amount: {
                value: "1000.00",
                currency: "RUB",
              },
              created_at: new Date().toISOString(),
            };

            if (!withOptional) {
              // Без опциональных полей - должно быть валидно
              responseData = baseData;
            } else if (validOptional) {
              // С валидными опциональными полями
              responseData = {
                ...baseData,
                description: "Тестовый платеж",
                confirmation: {
                  type: "redirect",
                  confirmation_url: "https://yookassa.ru/checkout/test",
                },
                metadata: { key: "value" },
              };
            } else {
              // С невалидными опциональными полями
              responseData = {
                ...baseData,
                description: 12345, // Число вместо строки
                confirmation: "invalid", // Строка вместо объекта
                metadata: "invalid", // Строка вместо объекта
              };
            }

            const result =
              yookassaPaymentResponseSchema.safeParse(responseData);

            // Проверяем результат
            if (!withOptional || validOptional) {
              // Должно быть валидно
              expect(result.success).toBe(true);
            } else {
              // Должно быть невалидно из-за неверных типов опциональных полей
              expect(result.success).toBe(false);
              if (!result.success) {
                expect(result.error.errors.length).toBeGreaterThan(0);
              }
            }
          },
        ),
        {
          numRuns: 100,
          timeout: 60000,
        },
      );
    },
    { timeout: 90000 },
  );
});
