import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import { yookassaPaymentResponseSchema } from "@qbs-autonaim/validators";

/**
 * Конфигурация клиента ЮКасса
 */
interface YookassaConfig {
  shopId: string;
  secretKey: string;
  apiUrl: string;
  timeoutMs?: number;
}

/**
 * Клиент для работы с API ЮКасса
 *
 * Используется в webhook-сервисе для верификации платежей.
 * Содержит только метод getPayment, так как webhook-сервис
 * не создает платежи, а только проверяет их статус.
 */
export class YookassaClient {
  private config: YookassaConfig;
  private readonly DEFAULT_TIMEOUT_MS = 10000; // 10 секунд по умолчанию

  constructor(config: YookassaConfig) {
    this.config = config;
  }

  /**
   * Получает информацию о платеже из API ЮКасса
   *
   * Используется для API-верификации webhook-уведомлений.
   *
   * @param paymentId - ID платежа в ЮКасса
   * @returns Информация о платеже
   * @throws Error если платеж не найден или произошла ошибка API
   */
  async getPayment(paymentId: string): Promise<YookassaPaymentResponse> {
    const timeoutMs = this.config.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;

    try {
      const response = await fetch(
        `${this.config.apiUrl}/payments/${paymentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${this.getAuthHeader()}`,
          },
          signal: AbortSignal.timeout(timeoutMs),
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Платеж не найден в ЮКасса");
        }
        const error = (await response.json()) as { description?: string };
        throw new Error(
          `Ошибка получения платежа: ${error.description || response.statusText}`,
        );
      }

      const data = await response.json();
      return yookassaPaymentResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `Превышено время ожидания ответа от ЮКасса (${timeoutMs}ms)`,
        );
      }
      throw error;
    }
  }

  /**
   * Генерирует заголовок Basic Auth для запросов к API ЮКасса
   *
   * @returns Base64-закодированная строка "shopId:secretKey"
   */
  private getAuthHeader(): string {
    const credentials = `${this.config.shopId}:${this.config.secretKey}`;
    return Buffer.from(credentials).toString("base64");
  }
}

/**
 * Фабрика для создания клиента ЮКасса
 *
 * Читает конфигурацию из переменных окружения и создает
 * настроенный экземпляр клиента.
 *
 * @returns Настроенный клиент ЮКасса
 * @throws Error если отсутствуют обязательные переменные окружения
 */
export function createYookassaClient(): YookassaClient {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const apiUrl = process.env.YOOKASSA_API_URL || "https://api.yookassa.ru/v3";

  if (!shopId || !secretKey) {
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
