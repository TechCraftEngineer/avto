"use client";

import { useSession } from "~/auth/client";
import { useIdentifyUser } from "~/hooks/use-posthog";

export function PostHogAuthTracker() {
  const { data: session } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      }
    : null;

  useIdentifyUser(user);
  return null;
}
