"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { env } from "~/env";

const IS_PRODUCTION = env.NODE_ENV === "production";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!IS_PRODUCTION || !pathname) return;

    let url = window.origin + pathname;
    if (searchParams?.toString()) {
      url = `${url}?${searchParams.toString()}`;
    }
    posthog.capture("$pageview", {
      $current_url: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!IS_PRODUCTION) return;

    const key = env.NEXT_PUBLIC_POSTHOG_KEY;
    const proxyUrl = env.NEXT_PUBLIC_AI_PROXY_URL;

    if (!key) return;
    if (!proxyUrl) {
      console.error(
        "[PostHog] NEXT_PUBLIC_AI_PROXY_URL is not set; skipping analytics initialization",
      );
      return;
    }
    console.log("posthog init");
    posthog.init(key, {
      api_host: `${proxyUrl}/api/analytics`,
      ui_host: "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
    });

    if (env.NODE_ENV === "development") {
      posthog.opt_out_capturing();
    }

    // Глобальный обработчик необработанных ошибок
    const handleError = (event: ErrorEvent) => {
      posthog.capture("$exception", {
        $exception_message: event.message,
        $exception_type: "Error",
        $exception_stack_trace_raw: event.error?.stack,
        $exception_level: "error",
        $exception_source: event.filename,
        $exception_lineno: event.lineno,
        $exception_colno: event.colno,
      });
    };

    // Обработчик необработанных промисов
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      posthog.capture("$exception", {
        $exception_message: error.message,
        $exception_type: "UnhandledRejection",
        $exception_stack_trace_raw: error.stack,
        $exception_level: "error",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
