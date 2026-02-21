"use client";

import { Toaster } from "@qbs-autonaim/ui/components/sonner";
import { ThemeProvider } from "@qbs-autonaim/ui/components/theme";
import { ErrorBoundary } from "~/components/shared/error-boundary";
import { PostHogAuthTracker } from "~/components/shared/posthog-auth-tracker";
import { PostHogProvider } from "~/components/shared/posthog-provider";
import { TRPCReactProvider } from "~/trpc/react";

interface ClientLayoutProps {
  children: React.ReactNode;
  user?: { id: string; email?: string; name?: string } | null;
}

export function ClientLayout({ children, user }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <PostHogProvider>
        <PostHogAuthTracker user={user ?? undefined} />
        <ErrorBoundary>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ErrorBoundary>
        <Toaster />
      </PostHogProvider>
    </ThemeProvider>
  );
}
