import { env } from "@qbs-autonaim/config";
import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (posthogClient) return posthogClient;

  const key = env.POSTHOG_KEY;
  if (!key) return null;

  // Используем прокси если настроен AI_PROXY_URL (для обхода блокировок)
  const host = env.AI_PROXY_URL
    ? `${env.AI_PROXY_URL}/api/analytics`
    : env.POSTHOG_HOST;

  posthogClient = new PostHog(key, { host });

  let exitHandlerRegistered = false;
  const shutdown = async () => {
    if (!posthogClient) return;
    try {
      await posthogClient.shutdown();
    } catch (e) {
      console.error("[posthog] shutdown error:", e);
    }
  };
  const onExit = () => {
    if (!exitHandlerRegistered) {
      exitHandlerRegistered = true;
      void shutdown();
    }
  };
  process.once("beforeExit", onExit);
  process.once("SIGTERM", onExit);
  process.once("SIGINT", onExit);

  return posthogClient;
}

export interface CaptureExceptionOptions {
  /** Сообщение об ошибке */
  message: string;
  /** Тип ошибки (Error, ORPCError, UnhandledRejection и т.д.) */
  type?: string;
  /** Стек вызовов */
  stack?: string;
  /** Дополнительный контекст (путь, userId, status и т.д.) */
  context?: Record<string, unknown>;
  /** Уровень: error | fatal */
  level?: "error" | "fatal";
  /** Идентификатор пользователя для привязки к сессии */
  distinctId?: string;
}

/**
 * Отправляет исключение в PostHog для мониторинга.
 * Вызывается при ошибках API, сервера и т.д.
 * Безопасно вызывать без настроенного PostHog — вызов игнорируется.
 */
export function captureExceptionToPostHog(
  options: CaptureExceptionOptions,
): void {
  try {
    const client = getPostHogClient();
    if (!client) return;

    const {
      message,
      type = "Error",
      stack,
      context = {},
      level = "error",
      distinctId = "server",
    } = options;

    client.capture({
      distinctId,
      event: "$exception",
      properties: {
        $exception_message: message,
        $exception_type: type,
        $exception_level: level,
        $exception_stack_trace_raw: stack,
        ...context,
      },
    });
  } catch {
    // Не даём ошибке PostHog сломать основной поток
  }
}
