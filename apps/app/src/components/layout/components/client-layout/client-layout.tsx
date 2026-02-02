"use client";

import { ThemeProvider } from "@qbs-autonaim/ui/themeprovider";
import Toaster from "@qbs-autonaim/ui/toaster";
import { TRPCReactProvider } from "~/trpc/react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
      <Toaster />
    </ThemeProvider>
  );
}

