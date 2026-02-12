import { useCallback } from "react";
import { env } from "~/env";
import { isPostHogReady, posthog } from "~/lib/posthog";

export function usePostHog() {
  const isProduction = env.NODE_ENV === "production";

  const capture = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      if (!isPostHogReady() || !isProduction) return;
      posthog.capture(eventName, properties);
    },
    [isProduction],
  );

  const identify = useCallback(
    (userId: string, properties?: Record<string, unknown>) => {
      if (!isPostHogReady() || !isProduction) return;
      console.log("identify", userId, properties);
      posthog.identify(userId, properties);
    },
    [isProduction],
  );

  const reset = useCallback(() => {
    if (!isPostHogReady() || !isProduction) return;
    posthog.reset();
  }, [isProduction]);

  return {
    capture,
    identify,
    reset,
    posthog,
    isEnabled: isProduction && isPostHogReady(),
  };
}
