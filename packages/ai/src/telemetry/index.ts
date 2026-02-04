/**
 * Модуль для работы с телеметрией Langfuse через OpenTelemetry
 *
 * Использует NodeSDK с LangfuseSpanProcessor для отправки трейсов в Langfuse.
 *
 * Для работы нужны переменные окружения:
 * - LANGFUSE_PUBLIC_KEY
 * - LANGFUSE_SECRET_KEY
 * - LANGFUSE_BASE_URL (опционально, по умолчанию https://cloud.langfuse.com)
 */

import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { env } from "@qbs-autonaim/config";
import { Langfuse } from "langfuse";

let langfuseClient: Langfuse | null = null;
let otelSdk: NodeSDK | null = null;

/**
 * Получает или создает клиент Langfuse
 */
function getLangfuseClient(): Langfuse {
  if (!langfuseClient) {
    langfuseClient = new Langfuse({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_BASE_URL,
    });
  }
  return langfuseClient;
}

/**
 * Инициализирует телеметрию с OpenTelemetry и Langfuse
 */
export function initializeTelemetry(): void {
  // Проверяем наличие необходимых переменных окружения
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) {
    console.warn(
      "[Telemetry] Langfuse не настроен. Установите LANGFUSE_PUBLIC_KEY и LANGFUSE_SECRET_KEY",
    );
    return;
  }

  // Инициализируем клиент Langfuse
  getLangfuseClient();

  // Инициализируем OpenTelemetry SDK с LangfuseSpanProcessor
  if (!otelSdk) {
    otelSdk = new NodeSDK({
      spanProcessors: [new LangfuseSpanProcessor()],
    });

    otelSdk.start();
    console.log(
      "[Telemetry] OpenTelemetry SDK с LangfuseSpanProcessor запущен",
    );
  }
}

/**
 * Завершает работу и отправляет все оставшиеся трейсы в Langfuse
 */
export async function shutdownTelemetry(): Promise<void> {
  try {
    // Останавливаем OpenTelemetry SDK
    if (otelSdk) {
      await otelSdk.shutdown();
      console.log("[Telemetry] OpenTelemetry SDK остановлен");
    }

    // Отправляем оставшиеся трейсы в Langfuse
    if (langfuseClient) {
      await langfuseClient.flushAsync();
      console.log("[Telemetry] Все трейсы отправлены в Langfuse");
    }
  } catch (error) {
    console.error(
      "[Telemetry] Ошибка при завершении работы телеметрии:",
      error,
    );
  }
}

/**
 * Alias для shutdownTelemetry для удобства использования
 */
export const flushTelemetry = shutdownTelemetry;

/**
 * Проверяет, настроена ли телеметрия
 */
export function isTelemetryInitialized(): boolean {
  return langfuseClient !== null;
}

export * from "./inngest-wrapper";
