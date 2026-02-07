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
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { env } from "@qbs-autonaim/config";
import { Langfuse } from "langfuse";

let langfuseClient: Langfuse | null = null;
let otelSdk: NodeSDK | null = null;

/**
 * Фильтрующий SpanProcessor, который пропускает только спаны, связанные с AI
 * Отфильтровывает события inngest.execution, оставляя только общение с ботом
 */
class FilteredLangfuseSpanProcessor extends LangfuseSpanProcessor {
  onEnd(span: ReadableSpan): void {
    const spanName = span.name;
    const attributes = span.attributes;

    // Пропускаем только спаны, связанные с AI SDK
    // Фильтруем по имени спана или атрибутам
    const isAISpan =
      spanName.includes("ai.") || // AI SDK спаны начинаются с "ai."
      spanName.includes("generate") || // Вызовы генерации
      spanName.includes("agent") || // Агенты
      attributes["ai.operationId"] !== undefined || // AI SDK операции
      attributes["ai.model.id"] !== undefined || // Модели AI
      attributes["ai.prompt"] !== undefined || // Промпты
      attributes["gen_ai.system"] !== undefined; // OpenTelemetry semantic conventions для AI

    // Пропускаем inngest.execution и другие не-AI спаны
    if (!isAISpan && (spanName.includes("inngest") || spanName === "step")) {
      return;
    }

    // Передаем только AI-спаны в Langfuse
    super.onEnd(span);
  }
}

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

  // Инициализируем OpenTelemetry SDK с фильтрующим LangfuseSpanProcessor
  if (!otelSdk) {
    otelSdk = new NodeSDK({
      spanProcessors: [new FilteredLangfuseSpanProcessor()],
    });

    otelSdk.start();
    console.log(
      "[Telemetry] OpenTelemetry SDK с фильтрующим LangfuseSpanProcessor запущен (только AI-спаны)",
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

// Inngest wrapper for telemetry
export * from "./inngest-wrapper";
