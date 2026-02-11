"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { env } from "~/env";
import { initPostHog, posthog } from "~/lib/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProduction = env.VERCEL_ENV === "production";

  useEffect(() => {
    if (isProduction) {
      initPostHog();
    }
  }, [isProduction]);

  useEffect(() => {
    if (!isProduction || !pathname) return;

    let url = window.origin + pathname;
    if (searchParams?.toString()) {
      url = `${url}?${searchParams.toString()}`;
    }
    posthog.capture("$pageview", {
      $current_url: url,
    });
  }, [pathname, searchParams, isProduction]);

  return <>{children}</>;
}
