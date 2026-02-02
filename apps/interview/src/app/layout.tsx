import { cn } from "@qbs-autonaim/ui";
import { Toaster } from "@qbs-autonaim/ui/sonner";
import { ThemeProvider } from "@qbs-autonaim/ui/theme";
import type { Metadata, Viewport } from "next";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: "AI Интервью - QBS Автонайм",
  description:
    "Пройдите AI-интервью для отбора на вакансию или задание. Быстро, удобно, автоматически.",
  openGraph: {
    title: "AI Интервью - QBS Автонайм",
    description:
      "Пройдите AI-интервью для отбора на вакансию или задание. Быстро, удобно, автоматически.",
    siteName: "QBS Интервью",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
