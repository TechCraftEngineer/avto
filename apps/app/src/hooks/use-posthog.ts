"use client";

import { usePostHog as usePostHogOriginal } from "posthog-js/react";
import { useCallback, useEffect } from "react";

interface User {
  id: string;
  email?: string;
  name?: string;
}

// Re-export for convenience with capture helper
export const usePostHog = () => {
  const posthog = usePostHogOriginal();
  const isEnabled = posthog?.__loaded ?? false;

  const capture = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      if (isEnabled && posthog) {
        posthog.capture(event, properties);
      }
    },
    [posthog, isEnabled],
  );

  return {
    posthog,
    isEnabled,
    capture,
  };
};

export function useIdentifyUser(user: User | null) {
  const { posthog, isEnabled } = usePostHog();

  useEffect(() => {
    if (!isEnabled || !posthog) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
    } else {
      posthog.reset();
    }
  }, [user, posthog, isEnabled]);
}
