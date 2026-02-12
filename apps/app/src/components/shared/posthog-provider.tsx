"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { env } from "~/env";
import { initPostHog, posthog } from "~/lib/posthog";

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
    if (IS_PRODUCTION) {
      initPostHog();

      // Глобальный обработчик необработанных ошибок
      const handleError = (event: ErrorEvent) => {
        if (window.posthog) {
          window.posthog.capture("$exception", {
            $exception_message: event.message,
            $exception_type: "Error",
            $exception_stack_trace_raw: event.error?.stack,
            $exception_level: "error",
            $exception_source: event.filename,
            $exception_lineno: event.lineno,
            $exception_colno: event.colno,
          });
        }
      };

      // Обработчик необработанных промисов
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        if (window.posthog) {
          const error =
            event.reason instanceof Error
              ? event.reason
              : new Error(String(event.reason));
          window.posthog.capture("$exception", {
            $exception_message: error.message,
            $exception_type: "UnhandledRejection",
            $exception_stack_trace_raw: error.stack,
            $exception_level: "error",
          });
        }
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
    }
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
