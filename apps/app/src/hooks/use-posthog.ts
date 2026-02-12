"use client";

import { usePostHog as usePostHogOriginal } from "posthog-js/react";
import { useEffect } from "react";

interface User {
  id: string;
  email?: string;
  name?: string;
}

export function useIdentifyUser(user: User | null) {
  const posthog = usePostHogOriginal();

  useEffect(() => {
    if (user && posthog) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
    } else if (!user && posthog) {
      posthog.reset();
    }
  }, [user, posthog]);
}
