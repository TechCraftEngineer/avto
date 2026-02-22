"use client";

import { Toaster } from "@qbs-autonaim/ui/components/sonner";
import { ThemeProvider } from "@qbs-autonaim/ui/components/theme";
import { ErrorBoundary } from "~/components/shared/error-boundary";
import { ORPCReactProvider } from "~/orpc/react";
import { PostHogAuthTracker } from "~/components/shared/posthog-auth-tracker";
import { PostHogProvider } from "~/components/shared/posthog-provider";
import { TRPCReactProvider } from "~/orpc/react";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <PostHogProvider>
        <PostHogAuthTracker />
        <ErrorBoundary>
          <TRPCReactProvider>
            <ORPCReactProvider>{children}</ORPCReactProvider>
          </TRPCReactProvider>
        </ErrorBoundary>
        <Toaster />
      </PostHogProvider>
    </ThemeProvider>
  );
}
