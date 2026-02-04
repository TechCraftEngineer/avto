/**
 * Обертка для Inngest функций с автоматическим управлением телеметрией
 */

import { shutdownTelemetry } from "./index";

/**
 * Оборачивает Inngest функцию для автоматического завершения телеметрии
 * Используйте для долгоживущих процессов (Inngest functions, API handlers)
 */
export function withTelemetry<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fn: T): T {
  return (async (...args: unknown[]) => {
    try {
      const result = await fn(...args);
      return result;
    } finally {
      // Отправляем все трейсы в Langfuse после завершения функции
      await shutdownTelemetry();
    }
  }) as T;
}

/**
 * Хук для использования в конце Inngest функции
 * Гарантирует отправку всех трейсов в Langfuse
 */
export async function flushTelemetry(): Promise<void> {
  await shutdownTelemetry();
}
