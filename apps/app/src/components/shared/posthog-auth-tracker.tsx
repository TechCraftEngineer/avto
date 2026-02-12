"use client";

import { useIdentifyUser } from "~/hooks/use-posthog";

interface PostHogAuthTrackerProps {
  user?: {
    id: string;
    email?: string;
    name?: string;
  } | null;
}

export function PostHogAuthTracker({ user }: PostHogAuthTrackerProps) {
  useIdentifyUser(user ?? null);
  return null;
}
