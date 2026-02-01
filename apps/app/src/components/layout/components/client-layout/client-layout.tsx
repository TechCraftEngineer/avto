"use client";

import { ThemeProvider, Toaster } from "@qbs-autonaim/ui";
import { TRPCReactProvider } from "~/trpc/react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
      <Toaster />
    </ThemeProvider>
  );
}
