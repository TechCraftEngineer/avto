"use client";

import { useEffect } from "react";
import { usePostHog } from "~/hooks/use-posthog";

interface PostHogAuthTrackerProps {
  user?: {
    id: string;
    email?: string;
    name?: string;
  } | null;
}

export function PostHogAuthTracker({ user }: PostHogAuthTrackerProps) {
  const { identify, reset, isEnabled } = usePostHog();

  useEffect(() => {
    if (!isEnabled) return;

    if (user) {
      identify(user.id, {
        email: user.email,
        name: user.name,
      });
    } else {
      reset();
    }
  }, [user, identify, reset, isEnabled]);

  return null;
}
