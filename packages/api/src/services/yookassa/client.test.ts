import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { createYookassaClient, YookassaClient } from "./client";

describe("YookassaClient", () => {
  describe("constructor", () => {
    it("создает экземпляр с корректной конфигурацией", () => {
      const config = {
        shopId: "test-shop-id",
        secretKey: "test-secret-key",
        apiUrl: "https://api.yookassa.ru/v3",
      };

      const client = new YookassaClient(config);

      expect(client).toBeInstanceOf(YookassaClient);
    });
  });

  describe("createPayment", () => {
    let client: YookassaClient;
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      client = new YookassaClient({
        shopId: "test-shop-id",
        secretKey: "test-secret-key",
        apiUrl: "https://api.yookassa.ru/v3",
      });
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("создает платеж с корректными параметрами", async () => {
      const mockResponse = {
        id: "test-payment-id",
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
        metadata: { userId: "123" },
      };

      global.fetch = mock(async () => ({
        ok: true,
        json: async () => mockResponse,
      })) as typeof global.fetch;

      const result = await client.createPayment({
        amount: 1000,
        currency: "RUB",
        description: "Тестовый платеж",
        returnUrl: "https://example.com/return",
        metadata: { userId: "123" },
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Проверяем параметры вызова fetch
      const fetchCall = (global.fetch as ReturnType<typeof mock>).mock.calls[0];
      expect(fetchCall?.[0]).toBe("https://api.yookassa.ru/v3/payments");

      const fetchOptions = fetchCall?.[1] as RequestInit;
      expect(fetchOptions.method).toBe("POST");
      expect(fetchOptions.headers).toMatchObject({
        "Content-Type": "application/json",
        Authorization: expect.stringContaining("Basic"),
      });

      // Проверяем наличие Idempotence-Key
      const headers = fetchOptions.headers as Record<string, string>;
      expect(headers["Idempotence-Key"]).toBeDefined();
      expect(typeof headers["Idempotence-Key"]).toBe("string");

      // Проверяем тело запроса
      const body = JSON.parse(fetchOptions.body as string);
      expect(body).toMatchObject({
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: "https://example.com/return",
        },
        description: "Тестовый платеж",
        metadata: { userId: "123" },
      });
    });

    it("генерирует уникальный Idempotence-Key для каждого запроса", async () => {
      const mockResponse = {
        id: "test-payment-id",
        status: "pending" as const,
        amount: { value: "1000.00", currency: "RUB" },
        created_at: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = mock(async () => ({
        ok: true,
        json: async () => mockResponse,
      })) as typeof global.fetch;

      // Создаем два платежа
      await client.createPayment({
        amount: 1000,
        currency: "RUB",
        returnUrl: "https://example.com/return",
      });

      await client.createPayment({
        amount: 2000,
        currency: "RUB",
        returnUrl: "https://example.com/return",
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Получаем Idempotence-Key из обоих вызовов
      const calls = (global.fetch as ReturnType<typeof mock>).mock.calls;
      const key1 = (calls[0]?.[1] as RequestInit).headers?.[
        "Idempotence-Key" as keyof HeadersInit
      ];
      const key2 = (calls[1]?.[1] as RequestInit).headers?.[
        "Idempotence-Key" as keyof HeadersInit
      ];

      // Проверяем, что ключи разные
      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(key1).not.toBe(key2);
    });

    it("обрезает описание до 128 символов", async () => {
      const longDescription = "а".repeat(150);
      const mockResponse = {
        id: "test-payment-id",
        status: "pending" as const,
        amount: { value: "1000.00", currency: "RUB" },
        created_at: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = mock(async () => ({
        ok: true,
        json: async () => mockResponse,
      })) as typeof global.fetch;

      await client.createPayment({
        amount: 1000,
        currency: "RUB",
        description: longDescription,
        returnUrl: "https://example.com/return",
      });

      const fetchCall = (global.fetch as ReturnType<typeof mock>).mock.calls[0];
      const body = JSON.parse((fetchCall?.[1] as RequestInit).body as string);

      expect(body.description).toBe("а".repeat(128));
      expect(body.description.length).toBe(128);
    });

    it("выбрасывает ошибку при неуспешном ответе API", async () => {
      global.fetch = mock(async () => ({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          description: "Некорректные параметры платежа",
        }),
      })) as typeof global.fetch;

      await expect(
        client.createPayment({
          amount: 1000,
          currency: "RUB",
          returnUrl: "https://example.com/return",
        }),
      ).rejects.toThrow(
        "Ошибка создания платежа: Некорректные параметры платежа",
      );
    });

    it("выбрасывает ошибку с statusText если description отсутствует", async () => {
      global.fetch = mock(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({}),
      })) as typeof global.fetch;

      await expect(
        client.createPayment({
          amount: 1000,
          currency: "RUB",
          returnUrl: "https://example.com/return",
        }),
      ).rejects.toThrow("Ошибка создания платежа: Internal Server Error");
    });

    it("обрабатывает ошибку парсинга JSON ответа об ошибке", async () => {
      global.fetch = mock(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("Invalid JSON");
        },
      })) as typeof global.fetch;

      await expect(
        client.createPayment({
          amount: 1000,
          currency: "RUB",
          returnUrl: "https://example.com/return",
        }),
      ).rejects.toThrow("Ошибка создания платежа: Internal Server Error");
    });

    it("валидирует ответ через Zod схему", async () => {
      const invalidResponse = {
        id: "test-payment-id",
        // Отсутствует обязательное поле status
        amount: { value: "1000.00", currency: "RUB" },
      };

      global.fetch = mock(async () => ({
        ok: true,
        json: async () => invalidResponse,
      })) as typeof global.fetch;

      await expect(
        client.createPayment({
          amount: 1000,
          currency: "RUB",
          returnUrl: "https://example.com/return",
        }),
      ).rejects.toThrow();
    });

    it("корректно форматирует сумму с двумя десятичными знаками", async () => {
      const mockResponse = {
        id: "test-payment-id",
        status: "pending" as const,
        amount: { value: "1234.56", currency: "RUB" },
        created_at: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = mock(async () => ({
        ok: true,
        json: async () => mockResponse,
      })) as typeof global.fetch;

      await client.createPayment({
        amount: 1234.56,
        currency: "RUB",
        returnUrl: "https://example.com/return",
      });

      const fetchCall = (global.fetch as ReturnType<typeof mock>).mock.calls[0];
      const body = JSON.parse((fetchCall?.[1] as RequestInit).body as string);

      expect(body.amount.value).toBe("1234.56");
    });

    it("включает заголовок Authorization с Basic Auth", async () => {
      const mockResponse = {
        id: "test-payment-id",
        status: "pending" as const,
        amount: { value: "1000.00", currency: "RUB" },
        created_at: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = mock(async () => ({
        ok: true,
        json: async () => mockResponse,
      })) as typeof global.fetch;

      await client.createPayment({
        amount: 1000,
        currency: "RUB",
        returnUrl: "https://example.com/return",
      });

      const fetchCall = (global.fetch as ReturnType<typeof mock>).mock.calls[0];
      const headers = (fetchCall?.[1] as RequestInit).headers as Record<
        string,
        string
      >;

      expect(headers.Authorization).toBeDefined();
      expect(headers.Authorization).toMatch(/^Basic /);

      // Декодируем и проверяем формат
      const base64Part = headers.Authorization.replace("Basic ", "");
      const decoded = Buffer.from(base64Part, "base64").toString("utf-8");
      expect(decoded).toBe("test-shop-id:test-secret-key");
    });
  });

  describe("getPayment", () => {
    let client: YookassaClient;
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      client = new YookassaClient({
        shopId: "test-shop-id",
        secretKey: "test-secret-key",
        apiUrl: "https://api.yookassa.ru/v3",
      });
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("получает платеж с корректными параметрами", async () => {
      const mockResponse = {
        id: "test-payment-id",
        status: "succeeded" as const,
        amount: {
          value: "1000.00",
          currency: "RUB",
        },
        description: "Тестовый платеж",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = mock(async () => ({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })) as typeof global.fetch;

      const result = await client.getPayment("test-payment-id");

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Проверяем параметры вызова fetch
      const fetchCall = (global.fetch as ReturnType<typeof mock>).mock.calls[0];
      expect(fetchCall?.[0]).toBe(
        "https://api.yookassa.ru/v3/payments/test-payment-id",
      );

      const fetchOptions = fetchCall?.[1] as RequestInit;
      expect(fetchOptions.method).toBe("GET");
      expect(fetchOptions.headers).toMatchObject({
        Authorization: expect.stringContaining("Basic"),
      });
    });

    it("выбрасывает ошибку 'Платеж не найден' при статусе 404", async () => {
      global.fetch = mock(async () => ({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({
          description: "Payment not found",
        }),
      })) as typeof global.fetch;

      await expect(client.getPayment("non-existent-id")).rejects.toThrow(
        "Платеж не найден",
      );
    });

    it("выбрасывает ошибку при других неуспешных ответах API", async () => {
      global.fetch = mock(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({
          description: "Внутренняя ошибка сервера",
        }),
      })) as typeof global.fetch;

      await expect(client.getPayment("test-payment-id")).rejects.toThrow(
        "Ошибка получения платежа: Внутренняя ошибка сервера",
      );
    });

    it("выбрасывает ошибку с statusText если description отсутствует", async () => {
      global.fetch = mock(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({}),
      })) as typeof global.fetch;

      await expect(client.getPayment("test-payment-id")).rejects.toThrow(
        "Ошибка получения платежа: Internal Server Error",
      );
    });

    it("обрабатывает ошибку парсинга JSON ответа об ошибке", async () => {
      global.fetch = mock(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("Invalid JSON");
        },
      })) as typeof global.fetch;

      await expect(client.getPayment("test-payment-id")).rejects.toThrow(
        "Ошибка получения платежа: Internal Server Error",
      );
    });

    it("валидирует ответ через Zod схему", async () => {
      const invalidResponse = {
        id: "test-payment-id",
        // Отсутствует обязательное поле status
        amount: { value: "1000.00", currency: "RUB" },
      };

      global.fetch = mock(async () => ({
        ok: true,
        status: 200,
        json: async () => invalidResponse,
      })) as typeof global.fetch;

      await expect(client.getPayment("test-payment-id")).rejects.toThrow();
    });

    it("включает заголовок Authorization с Basic Auth", async () => {
      const mockResponse = {
        id: "test-payment-id",
        status: "succeeded" as const,
        amount: { value: "1000.00", currency: "RUB" },
        created_at: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = mock(async () => ({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })) as typeof global.fetch;

      await client.getPayment("test-payment-id");

      const fetchCall = (global.fetch as ReturnType<typeof mock>).mock.calls[0];
      const headers = (fetchCall?.[1] as RequestInit).headers as Record<
        string,
        string
      >;

      expect(headers.Authorization).toBeDefined();
      expect(headers.Authorization).toMatch(/^Basic /);

      // Декодируем и проверяем формат
      const base64Part = headers.Authorization.replace("Basic ", "");
      const decoded = Buffer.from(base64Part, "base64").toString("utf-8");
      expect(decoded).toBe("test-shop-id:test-secret-key");
    });

    it("корректно обрабатывает различные статусы платежей", async () => {
      const statuses = ["pending", "succeeded", "canceled"] as const;

      for (const status of statuses) {
        const mockResponse = {
          id: "test-payment-id",
          status,
          amount: { value: "1000.00", currency: "RUB" },
          created_at: "2024-01-01T00:00:00.000Z",
        };

        global.fetch = mock(async () => ({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        })) as typeof global.fetch;

        const result = await client.getPayment("test-payment-id");
        expect(result.status).toBe(status);
      }
    });
  });

  describe("getAuthHeader", () => {
    it("генерирует корректный Basic Auth заголовок", () => {
      const config = {
        shopId: "test-shop-id",
        secretKey: "test-secret-key",
        apiUrl: "https://api.yookassa.ru/v3",
      };

      const client = new YookassaClient(config);

      // Используем рефлексию для доступа к приватному методу в тестах
      const getAuthHeader = (client as any).getAuthHeader.bind(client);
      const authHeader = getAuthHeader();

      // Проверяем, что заголовок является base64-закодированной строкой
      expect(authHeader).toBeDefined();
      expect(typeof authHeader).toBe("string");

      // Декодируем и проверяем формат
      const decoded = Buffer.from(authHeader, "base64").toString("utf-8");
      expect(decoded).toBe("test-shop-id:test-secret-key");
    });

    it("корректно обрабатывает специальные символы в учетных данных", () => {
      const config = {
        shopId: "shop:with:colons",
        secretKey: "secret@with#special$chars",
        apiUrl: "https://api.yookassa.ru/v3",
      };

      const client = new YookassaClient(config);
      const getAuthHeader = (client as any).getAuthHeader.bind(client);
      const authHeader = getAuthHeader();

      const decoded = Buffer.from(authHeader, "base64").toString("utf-8");
      expect(decoded).toBe("shop:with:colons:secret@with#special$chars");
    });
  });
});

describe("createYookassaClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Сохраняем оригинальные переменные окружения
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Восстанавливаем оригинальные переменные окружения
    process.env = originalEnv;
  });

  it("создает клиент с переменными окружения", () => {
    process.env.YOOKASSA_SHOP_ID = "test-shop-id";
    process.env.YOOKASSA_SECRET_KEY = "test-secret-key";

    const client = createYookassaClient();

    expect(client).toBeInstanceOf(YookassaClient);
  });

  it("использует дефолтный API URL если не указан", () => {
    process.env.YOOKASSA_SHOP_ID = "test-shop-id";
    process.env.YOOKASSA_SECRET_KEY = "test-secret-key";
    delete process.env.YOOKASSA_API_URL;

    const client = createYookassaClient();

    expect(client).toBeInstanceOf(YookassaClient);
    // Проверяем, что используется дефолтный URL
    expect((client as any).config.apiUrl).toBe("https://api.yookassa.ru/v3");
  });

  it("использует кастомный API URL если указан", () => {
    process.env.YOOKASSA_SHOP_ID = "test-shop-id";
    process.env.YOOKASSA_SECRET_KEY = "test-secret-key";
    process.env.YOOKASSA_API_URL = "https://custom-api.example.com";

    const client = createYookassaClient();

    expect((client as any).config.apiUrl).toBe(
      "https://custom-api.example.com",
    );
  });

  it("выбрасывает ошибку при отсутствии YOOKASSA_SHOP_ID", () => {
    delete process.env.YOOKASSA_SHOP_ID;
    process.env.YOOKASSA_SECRET_KEY = "test-secret-key";

    expect(() => createYookassaClient()).toThrow(
      "Отсутствуют учетные данные ЮКасса (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)",
    );
  });

  it("выбрасывает ошибку при отсутствии YOOKASSA_SECRET_KEY", () => {
    process.env.YOOKASSA_SHOP_ID = "test-shop-id";
    delete process.env.YOOKASSA_SECRET_KEY;

    expect(() => createYookassaClient()).toThrow(
      "Отсутствуют учетные данные ЮКасса (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)",
    );
  });

  it("выбрасывает ошибку при отсутствии обеих переменных", () => {
    delete process.env.YOOKASSA_SHOP_ID;
    delete process.env.YOOKASSA_SECRET_KEY;

    expect(() => createYookassaClient()).toThrow(
      "Отсутствуют учетные данные ЮКасса (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)",
    );
  });

  it("выбрасывает ошибку при пустых строках в учетных данных", () => {
    process.env.YOOKASSA_SHOP_ID = "";
    process.env.YOOKASSA_SECRET_KEY = "";

    expect(() => createYookassaClient()).toThrow(
      "Отсутствуют учетные данные ЮКасса (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)",
    );
  });
});
