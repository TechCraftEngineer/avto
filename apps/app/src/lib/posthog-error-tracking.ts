import { PostHog } from "posthog-node";

let posthogNode: PostHog | null = null;

export function getPostHogNode(): PostHog | null {
  if (posthogNode) return posthogNode;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const proxyUrl = process.env.NEXT_PUBLIC_AI_PROXY_URL;

  if (!key || !proxyUrl) {
    console.warn("[PostHog] Ключи не настроены для error tracking");
    return null;
  }

  posthogNode = new PostHog(key, {
    host: `${proxyUrl}/api/analytics`,
  });

  return posthogNode;
}

export function registerPostHogErrorTracking() {
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    const posthog = getPostHogNode();

    if (posthog) {
      const errorMessage = args
        .map((arg) => {
          if (arg instanceof Error) {
            return `${arg.message}\n${arg.stack}`;
          }
          return String(arg);
        })
        .join(" ");

      posthog.capture({
        distinctId: "server",
        event: "$exception",
        properties: {
          $exception_message: errorMessage,
          $exception_type: "Error",
          $exception_level: "error",
        },
      });
    }

    originalConsoleError.apply(console, args);
  };

  if (typeof process !== "undefined") {
    process.on("unhandledRejection", (reason: unknown) => {
      const posthog = getPostHogNode();
      if (posthog) {
        const errorMessage =
          reason instanceof Error ? reason.message : String(reason);
        const stack = reason instanceof Error ? reason.stack : undefined;

        posthog.capture({
          distinctId: "server",
          event: "$exception",
          properties: {
            $exception_message: errorMessage,
            $exception_type: "UnhandledRejection",
            $exception_level: "error",
            $exception_stack_trace_raw: stack,
          },
        });
      }
    });

    process.on("uncaughtException", (error: Error) => {
      const posthog = getPostHogNode();
      if (posthog) {
        posthog.capture({
          distinctId: "server",
          event: "$exception",
          properties: {
            $exception_message: error.message,
            $exception_type: "UncaughtException",
            $exception_level: "fatal",
            $exception_stack_trace_raw: error.stack,
          },
        });
      }
    });
  }
}
