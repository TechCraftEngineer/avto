import { describe, expect, test } from "bun:test";
import {
  type YookassaPaymentResponse,
  type YookassaWebhook,
  yookassaPaymentResponseSchema,
  yookassaWebhookSchema,
} from "./payment";

describe("yookassaPaymentResponseSchema", () => {
  test("валидирует корректный ответ от ЮКасса", () => {
    const validResponse = {
      id: "2d8f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f8f",
      status: "pending" as const,
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      description: "Тестовый платеж",
      confirmation: {
        type: "redirect" as const,
        confirmation_url: "https://yookassa.ru/checkout/test",
      },
      created_at: "2024-01-01T00:00:00.000Z",
      metadata: {
        userId: "user-123",
        workspaceId: "workspace-456",
      },
    };

    const result = yookassaPaymentResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(validResponse.id);
      expect(result.data.status).toBe("pending");
      expect(result.data.amount.value).toBe("1000.00");
    }
  });

  test("валидирует ответ без опциональных полей", () => {
    const minimalResponse = {
      id: "payment-id",
      status: "succeeded" as const,
      amount: {
        value: "500.00",
        currency: "RUB",
      },
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = yookassaPaymentResponseSchema.safeParse(minimalResponse);
    expect(result.success).toBe(true);
  });

  test("отклоняет невалидный статус", () => {
    const invalidResponse = {
      id: "payment-id",
      status: "invalid_status",
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = yookassaPaymentResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  test("отклоняет невалидный URL подтверждения", () => {
    const invalidResponse = {
      id: "payment-id",
      status: "pending" as const,
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      confirmation: {
        type: "redirect" as const,
        confirmation_url: "not-a-valid-url",
      },
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = yookassaPaymentResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });
});

describe("yookassaWebhookSchema", () => {
  test("валидирует webhook с событием payment.succeeded", () => {
    const validWebhook = {
      type: "notification" as const,
      event: "payment.succeeded" as const,
      object: {
        id: "payment-id",
        status: "succeeded" as const,
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        description: "Тестовый платеж",
        metadata: {
          userId: "user-123",
        },
        created_at: "2024-01-01T00:00:00.000Z",
        paid: true,
      },
    };

    const result = yookassaWebhookSchema.safeParse(validWebhook);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.event).toBe("payment.succeeded");
      expect(result.data.object.status).toBe("succeeded");
    }
  });

  test("валидирует webhook с событием payment.canceled", () => {
    const validWebhook = {
      type: "notification" as const,
      event: "payment.canceled" as const,
      object: {
        id: "payment-id",
        status: "canceled" as const,
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        created_at: "2024-01-01T00:00:00.000Z",
      },
    };

    const result = yookassaWebhookSchema.safeParse(validWebhook);
    expect(result.success).toBe(true);
  });

  test("валидирует webhook с событием payment.waiting_for_capture", () => {
    const validWebhook = {
      type: "notification" as const,
      event: "payment.waiting_for_capture" as const,
      object: {
        id: "payment-id",
        status: "waiting_for_capture" as const,
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        created_at: "2024-01-01T00:00:00.000Z",
      },
    };

    const result = yookassaWebhookSchema.safeParse(validWebhook);
    expect(result.success).toBe(true);
  });

  test("отклоняет невалидный тип события", () => {
    const invalidWebhook = {
      type: "notification" as const,
      event: "payment.invalid_event",
      object: {
        id: "payment-id",
        status: "succeeded" as const,
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        created_at: "2024-01-01T00:00:00.000Z",
      },
    };

    const result = yookassaWebhookSchema.safeParse(invalidWebhook);
    expect(result.success).toBe(false);
  });

  test("отклоняет невалидный тип уведомления", () => {
    const invalidWebhook = {
      type: "invalid_type",
      event: "payment.succeeded" as const,
      object: {
        id: "payment-id",
        status: "succeeded" as const,
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        created_at: "2024-01-01T00:00:00.000Z",
      },
    };

    const result = yookassaWebhookSchema.safeParse(invalidWebhook);
    expect(result.success).toBe(false);
  });

  test("валидирует webhook без опциональных полей", () => {
    const minimalWebhook = {
      type: "notification" as const,
      event: "payment.succeeded" as const,
      object: {
        id: "payment-id",
        status: "succeeded" as const,
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        created_at: "2024-01-01T00:00:00.000Z",
      },
    };

    const result = yookassaWebhookSchema.safeParse(minimalWebhook);
    expect(result.success).toBe(true);
  });
});
