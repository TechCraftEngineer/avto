import posthog from "posthog-js";
import { env } from "~/env";

export function initPostHog() {
  if (typeof window === "undefined") return;

  const key = env.NEXT_PUBLIC_POSTHOG_KEY;
  const proxyUrl = env.NEXT_PUBLIC_AI_PROXY_URL;

  if (!key) return;
  if (proxyUrl == null || proxyUrl === "") {
    console.error(
      "[PostHog] NEXT_PUBLIC_AI_PROXY_URL is not set; skipping analytics initialization",
    );
    return;
  }

  posthog.init(key, {
    api_host: `${proxyUrl}/api/analytics`,
    ui_host: "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: true,
    loaded: (posthog) => {
      if (env.NODE_ENV === "development") {
        posthog.opt_out_capturing();
      }
    },
  });

  // Сохраняем экземпляр в window для доступа из ErrorBoundary
  window.posthog = posthog;
}

export { posthog };
