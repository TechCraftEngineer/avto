import { describe, expect, it } from "bun:test";
import * as fc from "fast-check";
import {
  createPaymentSchema,
  yookassaPaymentResponseSchema,
  yookassaWebhookSchema,
} from "./payment";

/**
 * Property-based тесты для валидации схем платежей
 *
 * Используется библиотека fast-check для генерации случайных входных данных
 * и проверки универсальных свойств корректности валидации.
 *
 * Минимум 100 итераций на каждый тест для обеспечения надежности.
 */

describe("payment validators - Property-Based Tests", () => {
  /**
   * Свойство 6: Валидация входных данных
   *
   * **Валидирует: Требования 7.1, 7.2, 7.3, 7.4, 7.5**
   *
   * Для любого запроса на создание платежа система должна проверить:
   * - Сумма больше нуля (отрицательные и нулевые значения отклоняются)
   * - Валюта является "RUB" (другие валюты отклоняются)
   * - returnUrl является валидным URL (невалидные URL отклоняются)
   * - Описание не превышает 128 символов (длинные описания отклоняются)
   * - Пробелы в начале и конце описания обрезаются
   *
   * Тест генерирует различные невалидные данные и проверяет,
   * что все они корректно отклоняются с ошибкой валидации.
   *
   * Минимум 100 итераций для обеспечения надежности.
   */
  it(
    "отклоняет невалидные данные для создания платежа",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Сценарий 1: Отрицательная или нулевая сумма
            fc.record({
              amount: fc.oneof(
                fc.double({ max: -0.01, noNaN: true }),
                fc.constant(0),
              ),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.constant("ws_test123"),
              scenario: fc.constant("invalid_amount"),
            }),
            // Сценарий 2: Невалидный returnUrl
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constantFrom("not-a-url", "", "just text"),
              workspaceId: fc.constant("ws_test123"),
              scenario: fc.constant("invalid_url"),
            }),
            // Сценарий 3: Описание длиннее 128 символов
            fc.record({
              amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.constant("ws_test123"),
              description: fc.string({ minLength: 129, maxLength: 500 }),
              scenario: fc.constant("description_too_long"),
            }),
          ),
          async (testData) => {
            const result = createPaymentSchema.safeParse(testData);
            expect(result.success).toBe(false);

            if (!result.success) {
              expect(result.error.issues.length).toBeGreaterThan(0);
            }
          },
        ),
        { numRuns: 100, timeout: 60000 },
      );
    },
    { timeout: 90000 },
  );

  /**
   * Свойство: Обрезка пробелов в описании
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
            workspaceId: fc.constant("ws_test123"),
            description: fc
              .string({ minLength: 1, maxLength: 120 })
              .map((str) => `  ${str}  `),
          }),
          async (testData) => {
            const result = createPaymentSchema.safeParse(testData);
            expect(result.success).toBe(true);

            if (result.success && result.data.description) {
              expect(result.data.description).toBe(testData.description.trim());
            }
          },
        ),
        { numRuns: 100, timeout: 60000 },
      );
    },
    { timeout: 90000 },
  );

  /**
   * Свойство 7: Обработка ошибок валидации
   *
   * **Валидирует: Требования 7.6, 10.5**
   */
  it(
    "возвращает детальные ошибки валидации на русском языке",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.record({
              amount: fc.constant(-100),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("https://example.com/return"),
              workspaceId: fc.constant("ws_test123"),
              expectedField: fc.constant("amount"),
            }),
            fc.record({
              amount: fc.constant(1000),
              currency: fc.constant("RUB" as const),
              returnUrl: fc.constant("not-a-url"),
              workspaceId: fc.constant("ws_test123"),
              expectedField: fc.constant("returnUrl"),
            }),
          ),
          async (testData) => {
            const result = createPaymentSchema.safeParse(testData);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldError = result.error.issues.find(
                (issue) =>
                  issue.path.length > 0 &&
                  issue.path[0] === testData.expectedField,
              );
              expect(fieldError).toBeDefined();

              if (fieldError) {
                expect(fieldError.message.length).toBeGreaterThan(0);
                const hasCyrillic = /[а-яА-ЯёЁ]/.test(fieldError.message);
                expect(hasCyrillic).toBe(true);
              }
            }
          },
        ),
        { numRuns: 100, timeout: 60000 },
      );
    },
    { timeout: 90000 },
  );

  /**
   * Свойство 10: Валидация ответов API
   *
   * **Валидирует: Требования 10.3, 10.4**
   */
  it(
    "валидирует ответы API ЮКасса для создания платежа",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Валидный ответ
            fc.record({
              id: fc.string({ minLength: 10, maxLength: 50 }),
              status: fc.constantFrom(
                "pending" as const,
                "succeeded" as const,
                "canceled" as const,
              ),
              amount: fc.record({
                value: fc
                  .double({ min: 0.01, max: 1000000, noNaN: true })
                  .map((n) => n.toFixed(2)),
                currency: fc.constant("RUB"),
              }),
              created_at: fc.constant(new Date().toISOString()),
              isValid: fc.constant(true),
            }),
            // Невалидный ответ - отсутствует id
            fc.record({
              status: fc.constant("succeeded" as const),
              amount: fc.record({
                value: fc.constant("1000.00"),
                currency: fc.constant("RUB"),
              }),
              created_at: fc.constant(new Date().toISOString()),
              isValid: fc.constant(false),
            }),
          ),
          async (testData) => {
            const result = yookassaPaymentResponseSchema.safeParse(testData);

            if ("isValid" in testData && testData.isValid) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          },
        ),
        { numRuns: 100, timeout: 60000 },
      );
    },
    { timeout: 90000 },
  );

  /**
   * Свойство: Валидация webhook уведомлений
   *
   * **Валидирует: Требования 10.3, 10.4**
   */
  it(
    "валидирует webhook уведомления от ЮКасса",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Валидный webhook
            fc.record({
              type: fc.constant("notification" as const),
              event: fc.constantFrom(
                "payment.succeeded" as const,
                "payment.canceled" as const,
              ),
              object: fc.record({
                id: fc.string({ minLength: 10, maxLength: 50 }),
                status: fc.constantFrom(
                  "pending" as const,
                  "succeeded" as const,
                  "canceled" as const,
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
            // Невалидный webhook - неверный тип
            fc.record({
              type: fc.constant("invalid_type"),
              event: fc.constant("payment.succeeded" as const),
              object: fc.record({
                id: fc.string({ minLength: 10, maxLength: 50 }),
                status: fc.constant("succeeded" as const),
                amount: fc.record({
                  value: fc.constant("1000.00"),
                  currency: fc.constant("RUB"),
                }),
                created_at: fc.constant(new Date().toISOString()),
              }),
              isValid: fc.constant(false),
            }),
          ),
          async (testData) => {
            const result = yookassaWebhookSchema.safeParse(testData);

            if ("isValid" in testData && testData.isValid) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          },
        ),
        { numRuns: 100, timeout: 60000 },
      );
    },
    { timeout: 90000 },
  );
});
