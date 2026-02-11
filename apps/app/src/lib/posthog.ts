import posthog from "posthog-js";
import { env } from "~/env";

export function initPostHog() {
  if (typeof window === "undefined") return;

  const key = env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!key) return;

  posthog.init(key, {
    api_host: "/api/analytics/ingest",
    ui_host: "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (posthog) => {
      if (env.NODE_ENV === "development") {
        posthog.opt_out_capturing();
      }
    },
  });
}

export { posthog };
