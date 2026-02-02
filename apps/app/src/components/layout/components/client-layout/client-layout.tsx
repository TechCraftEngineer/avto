"use client";

import { Toaster } from "@qbs-autonaim/ui/sonner";
import { ThemeProvider } from "@qbs-autonaim/ui/theme";
import { TRPCReactProvider } from "~/trpc/react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
      <Toaster />
    </ThemeProvider>
  );
}
