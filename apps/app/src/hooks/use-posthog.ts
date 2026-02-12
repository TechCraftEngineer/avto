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
    if (user && posthog) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
      console.log("identify", user.id, { email: user.email, name: user.name });
    } else if (!user && posthog) {
      posthog.reset();
    }
  }, [user, posthog]);
}
