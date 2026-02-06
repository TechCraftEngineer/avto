import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";

/**
 * Создание контекста для resumable streams
 * Требует Redis для работы
 */
export function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch {
    return null;
  }
}

/**
 * Проверка доступности Redis
 */
export function isRedisAvailable(): boolean {
  return Boolean(process.env.REDIS_URL);
}
