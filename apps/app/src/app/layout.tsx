import { APP_CONFIG } from "@qbs-autonaim/config";
import type { Metadata, Viewport } from "next";
import { ClientLayout } from "~/components";
import { env } from "~/env";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production" ? APP_CONFIG.url : "http://localhost:3000",
  ),
  title: "QBS Автонайм - Автоматизация работы с вакансиями HH.ru",
  description:
    "Платформа для автоматизации рекрутинга на HH.ru. Автоматический парсинг вакансий, откликов кандидатов и управление процессом найма.",
  openGraph: {
    title: "QBS Автонайм - Автоматизация работы с вакансиями HH.ru",
    description:
      "Платформа для автоматизации рекрутинга на HH.ru. Автоматический парсинг вакансий, откликов кандидатов и управление процессом найма.",
    url: APP_CONFIG.url,
    siteName: APP_CONFIG.name,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <ClientLayout>{props.children}</ClientLayout>
      </body>
    </html>
  );
}
