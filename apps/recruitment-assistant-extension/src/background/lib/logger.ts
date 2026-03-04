/**
 * Логирование для Service Worker
 */

export function log(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  console.log(`[Service Worker ${timestamp}]`, message, data ?? "");
}

export function logError(message: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[Service Worker ${timestamp}] ОШИБКА:`, message, error);
}
