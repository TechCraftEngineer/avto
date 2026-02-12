"use client";

import { Toaster } from "@qbs-autonaim/ui/sonner";
import { ThemeProvider } from "@qbs-autonaim/ui/theme";
import { ErrorBoundary } from "~/components/shared/error-boundary";
import { PostHogProvider } from "~/components/shared/posthog-provider";
import { TRPCReactProvider } from "~/trpc/react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PostHogProvider>
        <ErrorBoundary>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ErrorBoundary>
        <Toaster />
      </PostHogProvider>
    </ThemeProvider>
  );
}
