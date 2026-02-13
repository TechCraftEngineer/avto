"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

interface User {
  id: string;
  email?: string;
  name?: string;
}

export function useIdentifyUser(user: User | null) {
  const posthog = usePostHog();

  useEffect(() => {
    // Проверяем, что PostHog инициализирован
    if (!posthog?.__loaded) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
    } else {
      posthog.reset();
    }
  }, [user, posthog]);
}
