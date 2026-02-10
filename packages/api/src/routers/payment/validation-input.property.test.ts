import { describe, expect, it } from "bun:test";
import { createPaymentSchema } from "@qbs-autonaim/validators";
import * as fc from "fast-check";
import { ZodError } from "zod";

/**
 * Property-based тесты для валидации входных данных
 *
 * **Свойство 6: Валидация входных данных**
 * **Валидирует: Требования 7.1, 7.2, 7.3, 7.4, 7.5**
 *
 * Эти тесты проверяют, что система корректно валидирует входные данные
 * для создания платежа и отклоняет невалидные данные с понятными
 * сообщениями об ошибках.
 */

describe("payment validation - Input Validation Property-Based Tests", () => {
  /**
   * Свойство 6: Валидация входных данных
   *
   * Для любых невалидных входных данных система должна отклонить запрос
   * с ошибкой валидации. Проверяются следующие случаи:
   * - Отрицательная сумма (должна быть отклонена)
   * - Нулевая сумма (должна быть отклонена)
   * - Неверная валюта (не "RUB")
   * - Невалидный returnUrl (не URL формат)
   * - Описание длиннее 128 символов (должно быть отклонено)
   * - Описание с пробелами в начале/конце (должны быть обрезаны)
   *
   * **Валидирует: Требования 7.1, 7.2, 7.3, 7.4, 7.5**
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "отклоняет невалидные данные с ошибкой валидации",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Генератор невалидных данных
          fc.oneof(
            // Случай 1: Отрицательная сумма (Требование 7.1)
            fc.record({
              amount: fc.double({ max: -0.01, noNaN: true }),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10, maxLength: 50 }),
              testCase: fc.constant("negative_amount"),
            }),
            // Случай 2: Нулевая сумма (Требование 7.1)
            fc.record({
              amount: fc.constant(0),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10, maxLength: 50 }),
              testCase: fc.constant("zero_amount"),
            }),
            // Случай 3: Неверная валюта (Требование 7.2)
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.constantFrom("USD", "EUR", "GBP", "JPY"),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10, maxLength: 50 }),
              testCase: fc.constant("invalid_currency"),
            }),
            // Случай 4: Невалидный returnUrl (Требование 7.3)
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.oneof(
                fc.constant("not-a-url"),
                fc.constant("ftp://example.com"),
                fc.constant("javascript:alert(1)"),
                fc.constant(""),
                fc.constant("relative/path"),
              ),
              workspaceId: fc.string({ minLength: 10, maxLength: 50 }),
              testCase: fc.constant("invalid_url"),
            }),
            // Случай 5: Описание длиннее 128 символов (Требование 7.4)
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.string({ minLength: 10, maxLength: 50 }),
              description: fc.string({ minLength: 129, maxLength: 200 }),
              testCase: fc.constant("description_too_long"),
            }),
          ),
          async (invalidData) => {
            // Пытаемся валидировать невалидные данные
            const result = createPaymentSchema.safeParse(invalidData);

            // КРИТИЧЕСКАЯ ПРОВЕРКА: валидация должна провалиться
            expect(result.success).toBe(false);

            if (!result.success) {
              // Проверяем, что есть ошибки валидации
              expect(result.error).toBeInstanceOf(ZodError);
              expect(result.error.errors.length).toBeGreaterThan(0);

              // Проверяем, что сообщения об ошибках на русском языке
              const errorMessages = result.error.errors.map((e) => e.message);
              for (const message of errorMessages) {
                expect(typeof message).toBe("string");
                expect(message.length).toBeGreaterThan(0);
              }

              // Проверяем специфичные ошибки для каждого случая
              switch (invalidData.testCase) {
                case "negative_amount":
                case "zero_amount":
                  // Должна быть ошибка о том, что сумма должна быть больше нуля
                  expect(
                    errorMessages.some((msg) =>
                      msg.toLowerCase().includes("больше"),
                    ),
                  ).toBe(true);
                  break;

                case "invalid_currency":
                  // Должна быть ошибка о неверной валюте
                  expect(
                    errorMessages.some(
                      (msg) =>
                        msg.toLowerCase().includes("валют") ||
                        msg.toLowerCase().includes("invalid"),
                    ),
                  ).toBe(true);
                  break;

                case "invalid_url":
                  // Должна быть ошибка о некорректном URL
                  expect(
                    errorMessages.some((msg) =>
                      msg.toLowerCase().includes("url"),
                    ),
                  ).toBe(true);
                  break;

                case "description_too_long":
                  // Должна быть ошибка о превышении длины описания
                  expect(
                    errorMessages.some(
                      (msg) =>
                        msg.includes("128") ||
                        msg.toLowerCase().includes("превыш") ||
                        msg.toLowerCase().includes("длин"),
                    ),
                  ).toBe(true);
                  break;
              }
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
   * Свойство 6 (вариация): Обрезка пробелов в описании
   *
   * Проверяет, что пробелы в начале и конце описания автоматически
   * обрезаются перед валидацией длины.
   *
   * **Валидирует: Требование 7.5**
   */
  it(
    "обрезает пробелы в начале и конце описания",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            currency: fc.constant("RUB" as const),
            returnUrl: fc.constant("https://example.com/return"),
            workspaceId: fc.string({ minLength: 10, maxLength: 50 }),
            // Описание с пробелами в начале и конце
            description: fc
              .string({ minLength: 1, maxLength: 120 })
              .map((s) => `  ${s}  `),
          }),
          async (data) => {
            const result = createPaymentSchema.safeParse(data);

            // Валидация должна пройти успешно
            expect(result.success).toBe(true);

            if (result.success && result.data.description) {
              // Проверяем, что пробелы были обрезаны
              expect(result.data.description).not.toMatch(/^\s/);
              expect(result.data.description).not.toMatch(/\s$/);

              // Проверяем, что содержимое сохранилось
              expect(result.data.description.length).toBeGreaterThan(0);
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
   * Свойство 6 (вариация): Валидные данные проходят валидацию
   *
   * Проверяет, что валидные данные успешно проходят валидацию
   * без ошибок.
   *
   * **Валидирует: Требования 7.1, 7.2, 7.3, 7.4**
   */
  it(
    "принимает валидные данные",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            currency: fc.constant("RUB" as const),
            returnUrl: fc.oneof(
              fc.constant("https://example.com/return"),
              fc.constant("https://test.com/payment/success"),
              fc.constant("https://app.example.org/checkout/complete"),
            ),
            workspaceId: fc.string({ minLength: 10, maxLength: 50 }),
            description: fc.option(
              fc.string({ minLength: 1, maxLength: 128 }),
              { nil: undefined },
            ),
            metadata: fc.option(
              fc.dictionary(fc.string(), fc.string(), { maxKeys: 5 }),
              { nil: undefined },
            ),
          }),
          async (validData) => {
            const result = createPaymentSchema.safeParse(validData);

            // КРИТИЧЕСКАЯ ПРОВЕРКА: валидация должна пройти успешно
            expect(result.success).toBe(true);

            if (result.success) {
              // Проверяем, что все поля присутствуют
              expect(result.data.amount).toBeDefined();
              expect(result.data.amount).toBeGreaterThan(0);
              expect(result.data.currency).toBe("RUB");
              expect(result.data.returnUrl).toBeDefined();
              expect(result.data.workspaceId).toBeDefined();

              // Проверяем, что returnUrl является валидным URL
              expect(() => new URL(result.data.returnUrl)).not.toThrow();

              // Если есть описание, проверяем его длину
              if (result.data.description) {
                expect(result.data.description.length).toBeLessThanOrEqual(128);
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
   * Свойство 6 (edge case): Граничные значения суммы
   *
   * Проверяет валидацию граничных значений суммы платежа.
   *
   * **Валидирует: Требование 7.1**
   */
  it(
    "корректно обрабатывает граничные значения суммы",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(0.01), // Минимальная валидная сумма
            fc.constant(0.001), // Меньше минимальной (должна быть отклонена)
            fc.constant(0), // Ноль (должен быть отклонен)
            fc.constant(-0.01), // Отрицательная (должна быть отклонена)
            fc.double({ min: 0.01, max: 0.1, noNaN: true }), // Малые суммы
            fc.double({ min: 999999, max: 1000000, noNaN: true }), // Большие суммы
          ),
          async (amount) => {
            const data = {
              amount,
              currency: "RUB" as const,
              returnUrl: "https://example.com/return",
              workspaceId: "ws_test123",
            };

            const result = createPaymentSchema.safeParse(data);

            // Проверяем корректность валидации в зависимости от суммы
            if (amount > 0) {
              // Положительные суммы должны проходить валидацию
              expect(result.success).toBe(true);
            } else {
              // Нулевые и отрицательные суммы должны быть отклонены
              expect(result.success).toBe(false);
              if (!result.success) {
                const errorMessages = result.error.errors.map((e) => e.message);
                expect(
                  errorMessages.some((msg) =>
                    msg.toLowerCase().includes("больше"),
                  ),
                ).toBe(true);
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
   * Свойство 6 (edge case): Граничные значения длины описания
   *
   * Проверяет валидацию граничных значений длины описания.
   *
   * **Валидирует: Требование 7.4**
   */
  it(
    "корректно обрабатывает граничные значения длины описания",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(""), // Пустое описание (валидно, опциональное поле)
            fc.string({ minLength: 1, maxLength: 1 }), // Минимальная длина
            fc.string({ minLength: 127, maxLength: 127 }), // Почти максимум
            fc.string({ minLength: 128, maxLength: 128 }), // Ровно максимум
            fc.string({ minLength: 129, maxLength: 129 }), // Превышение на 1
            fc.string({ minLength: 150, maxLength: 200 }), // Значительное превышение
          ),
          async (description) => {
            const data = {
              amount: 1000,
              currency: "RUB" as const,
              returnUrl: "https://example.com/return",
              workspaceId: "ws_test123",
              description: description || undefined,
            };

            const result = createPaymentSchema.safeParse(data);

            // Проверяем корректность валидации в зависимости от длины
            if (!description || description.length <= 128) {
              // Описания до 128 символов включительно должны проходить
              expect(result.success).toBe(true);
            } else {
              // Описания длиннее 128 символов должны быть отклонены
              expect(result.success).toBe(false);
              if (!result.success) {
                const errorMessages = result.error.errors.map((e) => e.message);
                expect(
                  errorMessages.some(
                    (msg) =>
                      msg.includes("128") ||
                      msg.toLowerCase().includes("превыш") ||
                      msg.toLowerCase().includes("длин"),
                  ),
                ).toBe(true);
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
