import posthog from "posthog-js";
import { env } from "~/env";

export function initPostHog() {
  if (typeof window === "undefined") return;

  // Работает только в production
  if (env.VERCEL_ENV !== "production") return;

  const key = env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key) return;

  posthog.init(key, {
    api_host: host || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
  });
}

export { posthog };
