import { randomUUID } from "node:crypto";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import { yookassaPaymentResponseSchema } from "@qbs-autonaim/validators";

interface YookassaConfig {
  shopId: string;
  secretKey: string;
  apiUrl: string;
  timeoutMs?: number;
}

interface CreatePaymentParams {
  amount: number;
  currency: string;
  description?: string;
  returnUrl: string;
  metadata?: Record<string, unknown>;
  idempotenceKey?: string;
}

export class YookassaClient {
  private config: YookassaConfig;
  private readonly DEFAULT_TIMEOUT_MS = 30000; // 30 секунд по умолчанию

  constructor(config: YookassaConfig) {
    this.config = config;
  }

  /**
   * Создает платеж в ЮКасса
   *
   * Отправляет запрос к API ЮКасса с параметрами платежа и валидирует ответ через Zod.
   * Использует переданный idempotenceKey для обеспечения идемпотентности запроса.
   *
   * @param params - Параметры создания платежа (включая idempotenceKey)
   * @returns Данные созданного платежа от ЮКасса
   * @throws {Error} При ошибке создания платежа или валидации ответа
   *
   * @example
   * const idempotenceKey = randomUUID();
   * const payment = await client.createPayment({
   *   amount: 1000,
   *   currency: "RUB",
   *   description: "Оплата подписки",
   *   returnUrl: "https://example.com/return",
   *   metadata: { userId: "123" },
   *   idempotenceKey
   * });
   */
  async createPayment(
    params: CreatePaymentParams,
  ): Promise<YookassaPaymentResponse> {
    const idempotenceKey = params.idempotenceKey ?? randomUUID();

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
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? this.DEFAULT_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${this.config.apiUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotence-Key": idempotenceKey,
          Authorization: `Basic ${this.getAuthHeader()}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        // Логирование таймаута (Требование 9.3)
        console.error(
          JSON.stringify({
            level: "error",
            message: "Таймаут запроса к API ЮКасса при создании платежа",
            timestamp: new Date().toISOString(),
            context: {
              method: "POST",
              endpoint: "/payments",
              timeoutMs: this.config.timeoutMs ?? this.DEFAULT_TIMEOUT_MS,
              amount: params.amount,
              currency: params.currency,
            },
          }),
        );

        throw new Error("Превышено время ожидания ответа от платежной системы");
      }

      throw error;
    }
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
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? this.DEFAULT_TIMEOUT_MS,
    );

    try {
      const response = await fetch(
        `${this.config.apiUrl}/payments/${paymentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${this.getAuthHeader()}`,
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

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
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        // Логирование таймаута (Требование 9.3)
        console.error(
          JSON.stringify({
            level: "error",
            message: "Таймаут запроса к API ЮКасса при получении платежа",
            timestamp: new Date().toISOString(),
            context: {
              method: "GET",
              endpoint: `/payments/${paymentId}`,
              timeoutMs: this.config.timeoutMs ?? this.DEFAULT_TIMEOUT_MS,
              paymentId,
            },
          }),
        );

        throw new Error("Превышено время ожидания ответа от платежной системы");
      }

      throw error;
    }
  }

  /**
   * Отменяет платеж в статусе waiting_for_capture
   *
   * Отправляет POST-запрос к API ЮКасса для отмены авторизованного платежа.
   * Работает только для платежей в статусе waiting_for_capture (двухстадийные платежи).
   * Для платежей в статусе pending (одностадийные) отмена невозможна - они истекают автоматически.
   *
   * @param paymentId - Идентификатор платежа в ЮКасса
   * @returns Данные отмененного платежа от ЮКасса
   * @throws {Error} При ошибке отмены платежа или если платеж не в статусе waiting_for_capture
   *
   * @example
   * const canceledPayment = await client.cancelPayment("2c5e8c1e-000f-5000-9000-1b6c2c1e8c1e");
   */
  async cancelPayment(paymentId: string): Promise<YookassaPaymentResponse> {
    // Генерируем уникальный ключ идемпотентности
    const idempotenceKey = randomUUID();

    // Логирование запроса к API ЮКасса
    console.log(
      JSON.stringify({
        level: "info",
        message: "Запрос к API ЮКасса: отмена платежа",
        timestamp: new Date().toISOString(),
        context: {
          method: "POST",
          endpoint: `/payments/${paymentId}/cancel`,
          paymentId,
          idempotenceKey,
        },
      }),
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? this.DEFAULT_TIMEOUT_MS,
    );

    try {
      const response = await fetch(
        `${this.config.apiUrl}/payments/${paymentId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotence-Key": idempotenceKey,
            Authorization: `Basic ${this.getAuthHeader()}`,
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage =
          (error as { description?: string }).description ||
          response.statusText ||
          "Неизвестная ошибка";

        // Логирование ошибки API
        console.error(
          JSON.stringify({
            level: "error",
            message: "Ошибка API ЮКасса при отмене платежа",
            timestamp: new Date().toISOString(),
            context: {
              method: "POST",
              endpoint: `/payments/${paymentId}/cancel`,
              statusCode: response.status,
              errorMessage,
              paymentId,
            },
          }),
        );

        throw new Error(`Ошибка отмены платежа: ${errorMessage}`);
      }

      // Парсим и валидируем ответ через Zod
      const data = await response.json();
      const validatedData = yookassaPaymentResponseSchema.parse(data);

      // Логирование успешного ответа
      console.log(
        JSON.stringify({
          level: "info",
          message: "Успешный ответ от API ЮКасса: платеж отменен",
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
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        // Логирование таймаута
        console.error(
          JSON.stringify({
            level: "error",
            message: "Таймаут запроса к API ЮКасса при отмене платежа",
            timestamp: new Date().toISOString(),
            context: {
              method: "POST",
              endpoint: `/payments/${paymentId}/cancel`,
              timeoutMs: this.config.timeoutMs ?? this.DEFAULT_TIMEOUT_MS,
              paymentId,
            },
          }),
        );

        throw new Error("Превышено время ожидания ответа от платежной системы");
      }

      throw error;
    }
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
