import { randomUUID } from "node:crypto";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import { yookassaPaymentResponseSchema } from "@qbs-autonaim/validators";

interface YookassaConfig {
  shopId: string;
  secretKey: string;
  apiUrl: string;
}

interface CreatePaymentParams {
  amount: number;
  currency: string;
  description?: string;
  returnUrl: string;
  metadata?: Record<string, unknown>;
}

export class YookassaClient {
  private config: YookassaConfig;

  constructor(config: YookassaConfig) {
    this.config = config;
  }

  /**
   * Создает платеж в ЮКасса
   *
   * Генерирует уникальный Idempotence-Key для обеспечения идемпотентности запроса.
   * Отправляет запрос к API ЮКасса с параметрами платежа и валидирует ответ через Zod.
   *
   * @param params - Параметры создания платежа
   * @returns Данные созданного платежа от ЮКасса
   * @throws {Error} При ошибке создания платежа или валидации ответа
   *
   * @example
   * const payment = await client.createPayment({
   *   amount: 1000,
   *   currency: "RUB",
   *   description: "Оплата подписки",
   *   returnUrl: "https://example.com/return",
   *   metadata: { userId: "123" }
   * });
   */
  async createPayment(
    params: CreatePaymentParams,
  ): Promise<YookassaPaymentResponse> {
    // Генерируем уникальный ключ идемпотентности (Требование 1.2, 6.1)
    const idempotenceKey = randomUUID();

    // Формируем тело запроса
    const requestBody = {
      amount: {
        value: params.amount.toFixed(2),
        currency: params.currency,
      },
      capture: true,
      confirmation: {
        type: "redirect" as const,
        return_url: params.returnUrl,
      },
      description: params.description?.substring(0, 128),
      metadata: params.metadata,
    };

    // Логирование запроса к API ЮКасса (Требование 9.1)
    // Не логируем секретные данные: shopId, secretKey
    console.log(
      JSON.stringify({
        level: "info",
        message: "Запрос к API ЮКасса: создание платежа",
        timestamp: new Date().toISOString(),
        context: {
          method: "POST",
          endpoint: "/payments",
          amount: params.amount,
          currency: params.currency,
          userId: params.metadata?.userId,
          workspaceId: params.metadata?.workspaceId,
          idempotenceKey,
        },
      }),
    );

    // Отправляем запрос к API ЮКасса (Требование 1.1)
    const response = await fetch(`${this.config.apiUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: `Basic ${this.getAuthHeader()}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Обрабатываем ошибки API (Требование 1.5)
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage =
        (error as { description?: string }).description ||
        response.statusText ||
        "Неизвестная ошибка";

      // Логирование ошибки API (Требование 9.3)
      console.error(
        JSON.stringify({
          level: "error",
          message: "Ошибка API ЮКасса при создании платежа",
          timestamp: new Date().toISOString(),
          context: {
            method: "POST",
            endpoint: "/payments",
            statusCode: response.status,
            errorMessage,
            amount: params.amount,
            currency: params.currency,
          },
        }),
      );

      throw new Error(`Ошибка создания платежа: ${errorMessage}`);
    }

    // Парсим и валидируем ответ через Zod (Требование 10.3)
    const data = await response.json();
    const validatedData = yookassaPaymentResponseSchema.parse(data);

    // Логирование успешного ответа (Требование 9.1)
    console.log(
      JSON.stringify({
        level: "info",
        message: "Успешный ответ от API ЮКасса: платеж создан",
        timestamp: new Date().toISOString(),
        context: {
          paymentId: validatedData.id,
          status: validatedData.status,
          amount: validatedData.amount.value,
          currency: validatedData.amount.currency,
        },
      }),
    );

    return validatedData;
  }

  /**
   * Получает информацию о платеже из ЮКасса
   *
   * Выполняет GET-запрос к API ЮКасса для получения актуальной информации о платеже.
   * Валидирует ответ через Zod схему.
   *
   * @param paymentId - Идентификатор платежа в ЮКасса
   * @returns Данные платежа от ЮКасса
   * @throws {Error} При ошибке получения платежа, валидации ответа или если платеж не найден (404)
   *
   * @example
   * const payment = await client.getPayment("2c5e8c1e-000f-5000-9000-1b6c2c1e8c1e");
   */
  async getPayment(paymentId: string): Promise<YookassaPaymentResponse> {
    // Логирование запроса к API ЮКасса (Требование 9.1)
    console.log(
      JSON.stringify({
        level: "info",
        message: "Запрос к API ЮКасса: получение статуса платежа",
        timestamp: new Date().toISOString(),
        context: {
          method: "GET",
          endpoint: `/payments/${paymentId}`,
          paymentId,
        },
      }),
    );

    // Отправляем GET-запрос к API ЮКасса (Требование 4.1)
    const response = await fetch(
      `${this.config.apiUrl}/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${this.getAuthHeader()}`,
        },
      },
    );

    // Обрабатываем ошибку 404 - платеж не найден (Требование 4.3)
    if (response.status === 404) {
      // Логирование ошибки (Требование 9.3)
      console.error(
        JSON.stringify({
          level: "error",
          message: "Платеж не найден в API ЮКасса",
          timestamp: new Date().toISOString(),
          context: {
            method: "GET",
            endpoint: `/payments/${paymentId}`,
            statusCode: 404,
            paymentId,
          },
        }),
      );

      throw new Error("Платеж не найден");
    }

    // Обрабатываем другие ошибки API
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage =
        (error as { description?: string }).description ||
        response.statusText ||
        "Неизвестная ошибка";

      // Логирование ошибки API (Требование 9.3)
      console.error(
        JSON.stringify({
          level: "error",
          message: "Ошибка API ЮКасса при получении платежа",
          timestamp: new Date().toISOString(),
          context: {
            method: "GET",
            endpoint: `/payments/${paymentId}`,
            statusCode: response.status,
            errorMessage,
            paymentId,
          },
        }),
      );

      throw new Error(`Ошибка получения платежа: ${errorMessage}`);
    }

    // Парсим и валидируем ответ через Zod (Требование 10.3)
    const data = await response.json();
    const validatedData = yookassaPaymentResponseSchema.parse(data);

    // Логирование успешного ответа (Требование 9.1)
    console.log(
      JSON.stringify({
        level: "info",
        message: "Успешный ответ от API ЮКасса: статус платежа получен",
        timestamp: new Date().toISOString(),
        context: {
          paymentId: validatedData.id,
          status: validatedData.status,
          amount: validatedData.amount.value,
          currency: validatedData.amount.currency,
        },
      }),
    );

    return validatedData;
  }

  /**
   * Генерирует заголовок Basic Auth для аутентификации в API ЮКасса
   * Формат: Basic base64(shopId:secretKey)
   *
   * @returns Base64-закодированная строка с учетными данными
   * @private
   */
  private getAuthHeader(): string {
    const credentials = `${this.config.shopId}:${this.config.secretKey}`;
    return Buffer.from(credentials).toString("base64");
  }
}

/**
 * Фабрика для создания клиента ЮКасса
 * Читает конфигурацию из переменных окружения и создает настроенный экземпляр клиента
 *
 * @throws {Error} Если отсутствуют обязательные переменные окружения
 * @returns Настроенный экземпляр YookassaClient
 */
export function createYookassaClient(): YookassaClient {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const apiUrl = process.env.YOOKASSA_API_URL ?? "https://api.yookassa.ru/v3";

  if (!shopId || !secretKey) {
    // Логирование ошибки аутентификации (Требование 9.4)
    console.error(
      JSON.stringify({
        level: "error",
        message: "Ошибка конфигурации: отсутствуют учетные данные ЮКасса",
        timestamp: new Date().toISOString(),
        context: {
          errorType: "ConfigurationError",
          missingShopId: !shopId,
          missingSecretKey: !secretKey,
        },
      }),
    );

    throw new Error(
      "Отсутствуют учетные данные ЮКасса (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)",
    );
  }

  return new YookassaClient({
    shopId,
    secretKey,
    apiUrl,
  });
}
