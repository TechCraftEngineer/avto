import { describe, expect, it } from "bun:test";
import {
  checkPaymentStatusSchema,
  createPaymentSchema,
  yookassaWebhookSchema,
} from "@qbs-autonaim/validators";
import * as fc from "fast-check";
import { ZodError } from "zod";

/**
 * Property-based тесты для обработки ошибок валидации
 *
 * **Свойство 7: Обработка ошибок валидации**
 * **Валидирует: Требования 7.6, 10.5**
 *
 * Эти тесты проверяют, что система возвращает детальные ошибки валидации
 * с описанием проблемы на русском языке, и что ошибки содержат информацию
 * о том, какое поле невалидно.
 */

describe("payment validation - Error Handling Property-Based Tests", () => {
  /**
   * Свойство 7: Обработка ошибок валидации
   *
   * Для любых невалидных данных система должна вернуть детальные ошибки
   * валидации с описанием проблемы на русском языке.
   *
   * Проверяется:
   * - Наличие сообщения об ошибке
   * - Сообщение на русском языке (или содержит понятные термины)
   * - Указание на конкретное поле с ошибкой
   * - Описание проблемы
   *
   * **Валидирует: Требования 7.6, 10.5**
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "возвращает детальные ошибки валидации с описанием проблемы",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор различных типов невалидных данных
          fc.oneof(
            // Невалидная сумма
            fc.record({
              amount: fc.oneof(
                fc.double({ max: 0, noNaN: true }),
                fc.constant(NaN),
                fc.constant(Infinity),
              ),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10 }),
              fieldName: fc.constant("amount"),
            }),
            // Невалидная валюта
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.oneof(
                fc.constantFrom("USD", "EUR", "GBP"),
                fc.string({ minLength: 1, maxLength: 5 }),
                fc.constant(""),
              ),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10 }),
              fieldName: fc.constant("currency"),
            }),
            // Невалидный URL
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.oneof(
                fc.constant("not-a-url"),
                fc.constant(""),
                fc.string({ minLength: 1, maxLength: 20 }),
              ),
              workspaceId: fc.string({ minLength: 10 }),
              fieldName: fc.constant("returnUrl"),
            }),
            // Невалидное описание (слишком длинное)
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10 }),
              description: fc.string({ minLength: 129, maxLength: 300 }),
              fieldName: fc.constant("description"),
            }),
            // Отсутствующие обязательные поля
            fc.record({
              // amount отсутствует
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10 }),
              fieldName: fc.constant("amount"),
            }),
          ),
          async (invalidData) => {
            const result = createPaymentSchema.safeParse(invalidData);

            // КРИТИЧЕСКАЯ ПРОВЕРКА: валидация должна провалиться
            expect(result.success).toBe(false);

            if (!result.success) {
              const error = result.error as ZodError;

              // Проверка 1: Должны быть ошибки (Zod 4 использует issues)
              expect(error.issues).toBeDefined();
              expect(error.issues.length).toBeGreaterThan(0);

              // Проверка 2: Каждая ошибка должна иметь сообщение
              for (const err of error.issues) {
                expect(err.message).toBeDefined();
                expect(typeof err.message).toBe("string");
                expect(err.message.length).toBeGreaterThan(0);

                // Проверка 3: Каждая ошибка должна указывать на поле
                expect(err.path).toBeDefined();
                expect(Array.isArray(err.path)).toBe(true);

                // Проверка 4: Сообщение должно быть понятным
                // (содержать русские слова или понятные термины)
                const message = err.message.toLowerCase();
                const hasRussianOrUnderstandable =
                  // Русские слова
                  /[а-яё]/.test(message) ||
                  // Или понятные английские термины
                  message.includes("required") ||
                  message.includes("invalid") ||
                  message.includes("expected") ||
                  message.includes("url") ||
                  message.includes("number");

                expect(hasRussianOrUnderstandable).toBe(true);
              }

              // Проверка 5: Ошибка должна относиться к ожидаемому полю
              const errorPaths = error.issues.map((e) => e.path.join("."));
              const expectedField = invalidData.fieldName;

              if (expectedField) {
                const hasExpectedFieldError = errorPaths.some((path) =>
                  path.includes(expectedField),
                );
                expect(hasExpectedFieldError).toBe(true);
              }

              // Проверка 6: Можно получить форматированные ошибки
              const formattedErrors = error.format();
              expect(formattedErrors).toBeDefined();
              expect(typeof formattedErrors).toBe("object");
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
   * Свойство 7 (вариация): Ошибки для checkPaymentStatusSchema
   *
   * Проверяет, что схема проверки статуса платежа также возвращает
   * детальные ошибки валидации.
   *
   * **Валидирует: Требования 7.6, 10.5**
   */
  it(
    "возвращает детальные ошибки для checkPaymentStatusSchema",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Невалидный UUID
            fc.record({
              paymentId: fc.oneof(
                fc.constant("not-a-uuid"),
                fc.constant(""),
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.constant("12345678-1234-1234-1234-123456789012"), // Неправильный формат
              ),
            }),
            // Отсутствующее поле
            fc.record({}),
          ),
          async (invalidData) => {
            const result = checkPaymentStatusSchema.safeParse(invalidData);

            expect(result.success).toBe(false);

            if (!result.success) {
              const error = result.error as ZodError;

              // Должны быть ошибки с сообщениями (Zod 4 использует issues)
              expect(error.issues.length).toBeGreaterThan(0);

              for (const err of error.issues) {
                expect(err.message).toBeDefined();
                expect(typeof err.message).toBe("string");
                expect(err.message.length).toBeGreaterThan(0);

                // Сообщение должно быть понятным
                const message = err.message.toLowerCase();
                const hasRussianOrUnderstandable =
                  /[а-яё]/.test(message) ||
                  message.includes("uuid") ||
                  message.includes("invalid") ||
                  message.includes("required");

                expect(hasRussianOrUnderstandable).toBe(true);
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
   * Свойство 7 (вариация): Ошибки для yookassaWebhookSchema
   *
   * Проверяет, что схема webhook также возвращает детальные ошибки
   * валидации при невалидных данных.
   *
   * **Валидирует: Требования 10.4, 10.5**
   */
  it(
    "возвращает детальные ошибки для yookassaWebhookSchema",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Неверный тип
            fc.record({
              type: fc.constantFrom("invalid", "wrong", ""),
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
            // Неверное событие
            fc.record({
              type: fc.constant("notification" as const),
              event: fc.constantFrom("invalid.event", "payment.unknown", ""),
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
            // Отсутствующий object
            fc.record({
              type: fc.constant("notification" as const),
              event: fc.constant("payment.succeeded"),
            }),
            // Невалидный статус в object
            fc.record({
              type: fc.constant("notification" as const),
              event: fc.constant("payment.succeeded"),
              object: fc.record({
                id: fc.string({ minLength: 10 }),
                status: fc.constantFrom("invalid", "unknown", ""),
                amount: fc.record({
                  value: fc.constant("1000.00"),
                  currency: fc.constant("RUB"),
                }),
                created_at: fc.constant(new Date().toISOString()),
              }),
            }),
          ),
          async (invalidData) => {
            const result = yookassaWebhookSchema.safeParse(invalidData);

            expect(result.success).toBe(false);

            if (!result.success) {
              const error = result.error as ZodError;

              // Должны быть ошибки (Zod 4 использует issues)
              expect(error.issues.length).toBeGreaterThan(0);

              for (const err of error.issues) {
                // Каждая ошибка должна иметь сообщение
                expect(err.message).toBeDefined();
                expect(typeof err.message).toBe("string");
                expect(err.message.length).toBeGreaterThan(0);

                // Каждая ошибка должна указывать путь к полю
                expect(err.path).toBeDefined();
                expect(Array.isArray(err.path)).toBe(true);
              }

              // Можно получить форматированные ошибки
              const formattedErrors = error.format();
              expect(formattedErrors).toBeDefined();
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
   * Свойство 7 (вариация): Множественные ошибки валидации
   *
   * Проверяет, что когда несколько полей невалидны одновременно,
   * система возвращает ошибки для всех невалидных полей.
   *
   * **Валидирует: Требования 7.6, 10.5**
   */
  it(
    "возвращает ошибки для всех невалидных полей одновременно",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Все поля невалидны
            amount: fc.double({ max: 0, noNaN: true }), // Невалидная сумма
            currency: fc.constantFrom("USD", "EUR"), // Невалидная валюта
            returnUrl: fc.constant("not-a-url"), // Невалидный URL
            workspaceId: fc.string({ minLength: 10 }),
            description: fc.string({ minLength: 129, maxLength: 200 }), // Слишком длинное
          }),
          async (invalidData) => {
            const result = createPaymentSchema.safeParse(invalidData);

            expect(result.success).toBe(false);

            if (!result.success) {
              const error = result.error as ZodError;

              // Должно быть несколько ошибок (минимум 2) (Zod 4 использует issues)
              expect(error.issues.length).toBeGreaterThanOrEqual(2);

              // Ошибки должны относиться к разным полям
              const errorFields = new Set(
                error.issues.map((e) => e.path.join(".")),
              );
              expect(errorFields.size).toBeGreaterThanOrEqual(2);

              // Каждая ошибка должна быть информативной
              for (const err of error.issues) {
                expect(err.message).toBeDefined();
                expect(err.message.length).toBeGreaterThan(0);
                expect(err.path.length).toBeGreaterThan(0);
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
   * Свойство 7 (вариация): Структура ошибок Zod
   *
   * Проверяет, что ошибки валидации имеют правильную структуру Zod
   * и могут быть легко обработаны.
   *
   * **Валидирует: Требования 10.5**
   */
  it(
    "ошибки имеют правильную структуру Zod",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.record({
              amount: fc.double({ max: 0, noNaN: true }),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10 }),
            }),
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.constantFrom("USD", "EUR"),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10 }),
            }),
          ),
          async (invalidData) => {
            const result = createPaymentSchema.safeParse(invalidData);

            expect(result.success).toBe(false);

            if (!result.success) {
              const error = result.error as ZodError;

              // Проверяем структуру ZodError (Zod 4 использует issues)
              expect(error).toBeInstanceOf(ZodError);
              expect(error.name).toBe("ZodError");
              expect(error.issues).toBeDefined();
              expect(Array.isArray(error.issues)).toBe(true);

              // Проверяем методы ZodError
              expect(typeof error.format).toBe("function");
              expect(typeof error.flatten).toBe("function");
              expect(typeof error.toString).toBe("function");

              // Проверяем, что flatten работает
              const flattened = error.flatten();
              expect(flattened).toBeDefined();
              expect(flattened.formErrors).toBeDefined();
              expect(flattened.fieldErrors).toBeDefined();

              // Проверяем, что format работает
              const formatted = error.format();
              expect(formatted).toBeDefined();
              expect(formatted._errors).toBeDefined();
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
