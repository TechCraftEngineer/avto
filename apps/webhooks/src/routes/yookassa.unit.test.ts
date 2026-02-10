import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { randomUUID } from "node:crypto";
import { env } from "@qbs-autonaim/config/env";
import type { payment } from "@qbs-autonaim/db/schema";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import { Hono } from "hono";
import { yookassaRouter } from "./yookassa";

/**
 * Unit-тесты для webhook-роутера ЮКасса
 *
 * Тестируемые сценарии:
 * 1. Успешная обработка webhook с валидными данными
 * 2. Обновление статуса платежа (pending → succeeded)
 * 3. Обновление статуса платежа (pending → canceled)
 * 4. Установка completedAt для завершенных платежей
 * 5. Отклонение webhook без HTTPS
 * 6. Отклонение webhook с неверным портом
 * 7. Отклонение webhook с невалидной схемой
 * 8. Ошибка при платеже не найден в БД
 * 9. Ошибка при неудачной API-верификации
 * 10. Несовпадение статусов webhook и API (используется статус из API)
 *
 * **Валидирует: Требования 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.2**
 */

describe("yookassa webhook - Unit Tests", () => {
  let app: Hono;
  let originalFetch: typeof global.fetch;
  let mockDb: {
    select: ReturnType<typeof mock>;
    update: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    // Создаем приложение Hono с роутером
    app = new Hono();
    app.route("/webhooks/yookassa", yookassaRouter);

    originalFetch = global.fetch;

    // Мокируем переменные окружения через env
    process.env.YOOKASSA_SHOP_ID = "test-shop-id";
    process.env.YOOKASSA_SECRET_KEY = "test-secret-key";
    process.env.YOOKASSA_API_URL = "https://api.yookassa.ru/v3";

    // Создаем моки для БД
    mockDb = {
      select: mock(() => ({
        from: mock(() => ({
          where: mock(() => ({
            limit: mock(async () => []),
          })),
        })),
      })),
      update: mock(() => ({
        set: mock(() => ({
          where: mock(() => Promise.resolve()),
        })),
      })),
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.YOOKASSA_SHOP_ID;
    delete process.env.YOOKASSA_SECRET_KEY;
    delete process.env.YOOKASSA_API_URL;
  });

  /**
   * Тест 1: Успешная обработка webhook с валидными данными
   *
   * Проверяет, что при получении валидного webhook от ЮКасса:
   * - Выполняется API-верификация
   * - Платеж находится в БД
   * - Статус обновляется
   * - Возвращается HTTP 200 с { success: true }
   *
   * **Валидирует: Требования 3.1, 3.2, 3.3, 3.5**
   */
  it("успешно обрабатывает валидный webhook", async () => {
    const testYookassaId = `yookassa_${randomUUID()}`;
    const testPaymentId = randomUUID();

    // Мокируем успешную API-верификацию
    const mockApiResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "succeeded",
      amount: {
        value: "1000.00",
        currency: "RUB",
      },
      created_at: new Date().toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockApiResponse,
    })) as unknown as typeof global.fetch;

    // Мокируем БД - платеж существует
    mockDb.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => [
            {
              id: testPaymentId,
              yookassaId: testYookassaId,
              status: "pending",
              amount: "1000",
              currency: "RUB",
              userId: "user_test",
              workspaceId: "ws_test",
              organizationId: "org_test",
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: null,
            },
          ]),
        })),
      })),
    }));

    // Webhook payload
    const webhookPayload = {
      type: "notification",
      event: "payment.succeeded",
      object: {
        id: testYookassaId,
        status: "succeeded",
        amount: {
          value: "1000.00",
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

    // Проверки
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true });

    // Проверяем, что API-верификация была вызвана
    expect(global.fetch).toHaveBeenCalled();
  });

  /**
   * Тест 2: Обновление статуса платежа (pending → succeeded)
   *
   * Проверяет, что статус корректно обновляется с pending на succeeded
   * и устанавливается completedAt.
   *
   * **Валидирует: Требования 3.3, 3.4**
   */
  it("обновляет статус платежа с pending на succeeded", async () => {
    const testYookassaId = `yookassa_${randomUUID()}`;
    const testPaymentId = randomUUID();
    let updatedStatus: string | undefined;
    let updatedCompletedAt: Date | null | undefined;

    // Мокируем API-верификацию
    const mockApiResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "succeeded",
      amount: { value: "1000.00", currency: "RUB" },
      created_at: new Date().toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockApiResponse,
    })) as unknown as typeof global.fetch;

    // Мокируем БД
    mockDb.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => [
            {
              id: testPaymentId,
              yookassaId: testYookassaId,
              status: "pending",
              completedAt: null,
            },
          ]),
        })),
      })),
    }));

    mockDb.update = mock(() => ({
      set: mock(
        (data: {
          status: string;
          completedAt: Date | null;
          updatedAt: Date;
        }) => {
          updatedStatus = data.status;
          updatedCompletedAt = data.completedAt;
          return {
            where: mock(() => Promise.resolve()),
          };
        },
      ),
    }));

    const webhookPayload = {
      type: "notification",
      event: "payment.succeeded",
      object: {
        id: testYookassaId,
        status: "succeeded",
        amount: { value: "1000.00", currency: "RUB" },
        created_at: new Date().toISOString(),
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Port": "443",
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(200);
    expect(updatedStatus).toBe("succeeded");
    expect(updatedCompletedAt).toBeInstanceOf(Date);
  });

  /**
   * Тест 3: Обновление статуса платежа (pending → canceled)
   *
   * Проверяет, что статус корректно обновляется с pending на canceled
   * и устанавливается completedAt.
   *
   * **Валидирует: Требования 3.3, 3.4**
   */
  it("обновляет статус платежа с pending на canceled", async () => {
    const testYookassaId = `yookassa_${randomUUID()}`;
    const testPaymentId = randomUUID();
    let updatedStatus: string | undefined;
    let updatedCompletedAt: Date | null | undefined;

    // Мокируем API-верификацию
    const mockApiResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "canceled",
      amount: { value: "1000.00", currency: "RUB" },
      created_at: new Date().toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockApiResponse,
    })) as unknown as typeof global.fetch;

    // Мокируем БД
    mockDb.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => [
            {
              id: testPaymentId,
              yookassaId: testYookassaId,
              status: "pending",
              completedAt: null,
            },
          ]),
        })),
      })),
    }));

    mockDb.update = mock(() => ({
      set: mock(
        (data: {
          status: string;
          completedAt: Date | null;
          updatedAt: Date;
        }) => {
          updatedStatus = data.status;
          updatedCompletedAt = data.completedAt;
          return {
            where: mock(() => Promise.resolve()),
          };
        },
      ),
    }));

    const webhookPayload = {
      type: "notification",
      event: "payment.canceled",
      object: {
        id: testYookassaId,
        status: "canceled",
        amount: { value: "1000.00", currency: "RUB" },
        created_at: new Date().toISOString(),
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Port": "443",
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(200);
    expect(updatedStatus).toBe("canceled");
    expect(updatedCompletedAt).toBeInstanceOf(Date);
  });

  /**
   * Тест 4: Установка completedAt для завершенных платежей
   *
   * Проверяет, что completedAt устанавливается только для succeeded и canceled,
   * но не для pending.
   *
   * **Валидирует: Требования 3.3, 3.4**
   */
  it("устанавливает completedAt только для завершенных платежей", async () => {
    const testYookassaId = `yookassa_${randomUUID()}`;
    const testPaymentId = randomUUID();
    let updatedCompletedAt: Date | null | undefined;

    // Мокируем API-верификацию с pending статусом
    const mockApiResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "pending",
      amount: { value: "1000.00", currency: "RUB" },
      created_at: new Date().toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockApiResponse,
    })) as unknown as typeof global.fetch;

    // Мокируем БД
    mockDb.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => [
            {
              id: testPaymentId,
              yookassaId: testYookassaId,
              status: "pending",
              completedAt: null,
            },
          ]),
        })),
      })),
    }));

    mockDb.update = mock(() => ({
      set: mock(
        (data: {
          status: string;
          completedAt: Date | null;
          updatedAt: Date;
        }) => {
          updatedCompletedAt = data.completedAt;
          return {
            where: mock(() => Promise.resolve()),
          };
        },
      ),
    }));

    const webhookPayload = {
      type: "notification",
      event: "payment.waiting_for_capture",
      object: {
        id: testYookassaId,
        status: "pending",
        amount: { value: "1000.00", currency: "RUB" },
        created_at: new Date().toISOString(),
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Port": "443",
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(200);
    expect(updatedCompletedAt).toBeNull();
  });

  /**
   * Тест 5: Отклонение webhook без HTTPS
   *
   * Проверяет, что webhook отклоняется с HTTP 403, если не используется HTTPS.
   *
   * **Валидирует: Требование 3.2**
   */
  it("отклоняет webhook без HTTPS", async () => {
    const webhookPayload = {
      type: "notification",
      event: "payment.succeeded",
      object: {
        id: "test_id",
        status: "succeeded",
        amount: { value: "1000.00", currency: "RUB" },
        created_at: new Date().toISOString(),
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "http", // Не HTTPS
        "X-Forwarded-Port": "443",
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Forbidden");
    expect(body.message).toContain("HTTPS");
  });

  /**
   * Тест 6: Отклонение webhook с неверным портом
   *
   * Проверяет, что webhook отклоняется с HTTP 403, если порт не 443 или 8443.
   *
   * **Валидирует: Требование 3.2**
   */
  it("отклоняет webhook с неверным портом", async () => {
    const webhookPayload = {
      type: "notification",
      event: "payment.succeeded",
      object: {
        id: "test_id",
        status: "succeeded",
        amount: { value: "1000.00", currency: "RUB" },
        created_at: new Date().toISOString(),
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Port": "8080", // Неверный порт
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Forbidden");
    expect(body.message).toContain("порт");
  });

  /**
   * Тест 7: Отклонение webhook с невалидной схемой
   *
   * Проверяет, что webhook с невалидной структурой отклоняется с HTTP 400.
   *
   * **Валидирует: Требование 3.1**
   */
  it("отклоняет webhook с невалидной схемой", async () => {
    const invalidPayload = {
      type: "invalid_type", // Неверный тип
      event: "payment.succeeded",
      object: {
        id: "test_id",
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Port": "443",
      },
      body: JSON.stringify(invalidPayload),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Bad Request");
    expect(body.message).toContain("Невалидная структура webhook");
  });

  /**
   * Тест 8: Ошибка при платеже не найден в БД
   *
   * Проверяет, что если платеж не найден в БД, возвращается HTTP 404.
   *
   * **Валидирует: Требование 3.1**
   */
  it("возвращает 404 если платеж не найден в БД", async () => {
    const testYookassaId = `yookassa_${randomUUID()}`;

    // Мокируем API-верификацию
    const mockApiResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "succeeded",
      amount: { value: "1000.00", currency: "RUB" },
      created_at: new Date().toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockApiResponse,
    })) as unknown as typeof global.fetch;

    // Мокируем БД - платеж не найден
    mockDb.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => []), // Пустой массив
        })),
      })),
    }));

    const webhookPayload = {
      type: "notification",
      event: "payment.succeeded",
      object: {
        id: testYookassaId,
        status: "succeeded",
        amount: { value: "1000.00", currency: "RUB" },
        created_at: new Date().toISOString(),
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Port": "443",
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Not Found");
    expect(body.message).toContain("Платеж не найден");
  });

  /**
   * Тест 9: Ошибка при неудачной API-верификации
   *
   * Проверяет, что если API-верификация не удалась, возвращается HTTP 403.
   *
   * **Валидирует: Требование 3.2**
   */
  it("возвращает 403 при неудачной API-верификации", async () => {
    const testYookassaId = `yookassa_${randomUUID()}`;
    const testPaymentId = randomUUID();

    // Мокируем неудачную API-верификацию
    global.fetch = mock(async () => ({
      ok: false,
      status: 404,
      json: async () => ({
        type: "error",
        code: "not_found",
        description: "Платеж не найден",
      }),
    })) as unknown as typeof global.fetch;

    // Мокируем БД - платеж существует
    mockDb.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => [
            {
              id: testPaymentId,
              yookassaId: testYookassaId,
              status: "pending",
            },
          ]),
        })),
      })),
    }));

    const webhookPayload = {
      type: "notification",
      event: "payment.succeeded",
      object: {
        id: testYookassaId,
        status: "succeeded",
        amount: { value: "1000.00", currency: "RUB" },
        created_at: new Date().toISOString(),
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Port": "443",
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Forbidden");
    expect(body.message).toContain("верифицировать webhook");
  });

  /**
   * Тест 10: Несовпадение статусов webhook и API (используется статус из API)
   *
   * Проверяет, что если статус из webhook не совпадает со статусом из API,
   * используется статус из API как более надежный источник.
   *
   * **Валидирует: Требование 3.2**
   */
  it("использует статус из API при несовпадении с webhook", async () => {
    const testYookassaId = `yookassa_${randomUUID()}`;
    const testPaymentId = randomUUID();
    let updatedStatus: string | undefined;

    // Мокируем API-верификацию с другим статусом
    const mockApiResponse: YookassaPaymentResponse = {
      id: testYookassaId,
      status: "canceled", // API говорит canceled
      amount: { value: "1000.00", currency: "RUB" },
      created_at: new Date().toISOString(),
    };

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockApiResponse,
    })) as unknown as typeof global.fetch;

    // Мокируем БД
    mockDb.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => [
            {
              id: testPaymentId,
              yookassaId: testYookassaId,
              status: "pending",
              completedAt: null,
            },
          ]),
        })),
      })),
    }));

    mockDb.update = mock(() => ({
      set: mock(
        (data: {
          status: string;
          completedAt: Date | null;
          updatedAt: Date;
        }) => {
          updatedStatus = data.status;
          return {
            where: mock(() => Promise.resolve()),
          };
        },
      ),
    }));

    const webhookPayload = {
      type: "notification",
      event: "payment.succeeded",
      object: {
        id: testYookassaId,
        status: "succeeded", // Webhook говорит succeeded
        amount: { value: "1000.00", currency: "RUB" },
        created_at: new Date().toISOString(),
      },
    };

    const response = await app.request("/webhooks/yookassa/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Port": "443",
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(200);
    // Должен использоваться статус из API (canceled), а не из webhook (succeeded)
    expect(updatedStatus).toBe("canceled");
  });
});
