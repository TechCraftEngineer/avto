import { describe, expect, test } from "bun:test";
import {
  type CheckPaymentStatusInput,
  type CreatePaymentInput,
  checkPaymentStatusSchema,
  createPaymentSchema,
  type YookassaPaymentResponse,
  type YookassaWebhook,
  yookassaPaymentResponseSchema,
  yookassaWebhookSchema,
} from "./payment";

describe("Payment schemas and types exports", () => {
  test("все схемы экспортированы и доступны", () => {
    expect(createPaymentSchema).toBeDefined();
    expect(checkPaymentStatusSchema).toBeDefined();
    expect(yookassaPaymentResponseSchema).toBeDefined();
    expect(yookassaWebhookSchema).toBeDefined();
  });

  test("createPaymentSchema валидирует корректные данные", () => {
    const validData = {
      amount: 1000,
      currency: "RUB" as const,
      description: "Тестовый платеж",
      returnUrl: "https://example.com/return",
      workspaceId: "workspace-123",
    };

    const result = createPaymentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test("checkPaymentStatusSchema валидирует UUID", () => {
    const validData = {
      paymentId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = checkPaymentStatusSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test("yookassaPaymentResponseSchema валидирует ответ API", () => {
    const validResponse = {
      id: "test-payment-id",
      status: "pending" as const,
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      created_at: "2024-01-01T00:00:00Z",
    };

    const result = yookassaPaymentResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  test("yookassaWebhookSchema валидирует webhook уведомление", () => {
    const validWebhook = {
      type: "notification" as const,
      event: "payment.succeeded" as const,
      object: {
        id: "test-payment-id",
        status: "succeeded" as const,
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        created_at: "2024-01-01T00:00:00Z",
      },
    };

    const result = yookassaWebhookSchema.safeParse(validWebhook);
    expect(result.success).toBe(true);
  });

  test("TypeScript типы корректно выведены", () => {
    // Проверка, что типы компилируются
    const createInput: CreatePaymentInput = {
      amount: 1000,
      currency: "RUB",
      returnUrl: "https://example.com/return",
      workspaceId: "workspace-123",
    };

    const checkInput: CheckPaymentStatusInput = {
      paymentId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const response: YookassaPaymentResponse = {
      id: "test-id",
      status: "pending",
      amount: { value: "1000.00", currency: "RUB" },
      created_at: "2024-01-01T00:00:00Z",
    };

    const webhook: YookassaWebhook = {
      type: "notification",
      event: "payment.succeeded",
      object: {
        id: "test-id",
        status: "succeeded",
        amount: { value: "1000.00", currency: "RUB" },
        created_at: "2024-01-01T00:00:00Z",
      },
    };

    // Если код компилируется, типы работают корректно
    expect(createInput).toBeDefined();
    expect(checkInput).toBeDefined();
    expect(response).toBeDefined();
    expect(webhook).toBeDefined();
  });
});
