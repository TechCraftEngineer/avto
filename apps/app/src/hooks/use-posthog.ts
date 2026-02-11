import { useCallback } from "react";
import { env } from "~/env";
import { posthog } from "~/lib/posthog";

export function usePostHog() {
  const isProduction = env.VERCEL_ENV === "production";

  const capture = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      if (typeof window === "undefined" || !isProduction) return;
      posthog.capture(eventName, properties);
    },
    [isProduction],
  );

  const identify = useCallback(
    (userId: string, properties?: Record<string, unknown>) => {
      if (typeof window === "undefined" || !isProduction) return;
      posthog.identify(userId, properties);
    },
    [isProduction],
  );

  const reset = useCallback(() => {
    if (typeof window === "undefined" || !isProduction) return;
    posthog.reset();
  }, [isProduction]);

  return {
    capture,
    identify,
    reset,
    posthog,
    isEnabled: isProduction,
  };
}
