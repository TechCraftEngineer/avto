import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type React from "react";
import { DocsHeader } from "@/components/docs/docs-header";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const _geist = Geist({ subsets: ["latin", "cyrillic"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Документация QBS Автонайм — AI для автоматизации рекрутинга",
    template: "%s | Документация QBS Автонайм",
  },
  description:
    "Полная документация AI-платформы для автоматизации найма персонала. Интеграция с HH.ru, SuperJob, Telegram. AI-скрининг резюме, автоматические интервью, аналитика найма.",
  keywords: [
    "рекрутинг",
    "HR",
    "AI",
    "автоматизация найма",
    "HH.ru",
    "SuperJob",
    "Telegram бот",
    "скрининг резюме",
    "интервью кандидатов",
    "HR аналитика",
    "подбор персонала",
    "документация",
    "HR платформа",
  ],
  authors: [{ name: "QBS Автонайм" }],
  creator: "QBS Автонайм",
  publisher: "QBS Автонайм",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://docs.avtonaim.qbsoft.ru"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://docs.avtonaim.qbsoft.ru",
    title: "Документация QBS Автонайм — AI для автоматизации рекрутинга",
    description:
      "Полная документация AI-платформы для автоматизации найма персонала в России. Интеграция с HH.ru, SuperJob, Telegram. Экономьте до 80% времени на подборе кандидатов.",
    siteName: "QBS Автонайм",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QBS Автонайм — AI-платформа для рекрутинга",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Документация QBS Автонайм — AI для автоматизации рекрутинга",
    description:
      "Полная документация AI-платформы для автоматизации найма персонала. Интеграция с HH.ru, SuperJob, Telegram.",
    images: ["/og-image.png"],
    creator: "@qbs_autonaim",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "documentation",
  classification: "business software",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://avtonaim.qbsoft.ru/#organization",
        name: "QBS Автонайм",
        url: "https://avtonaim.qbsoft.ru",
        logo: {
          "@type": "ImageObject",
          url: "https://avtonaim.qbsoft.ru/logo.png",
          width: 512,
          height: 512,
        },
        description:
          "AI-платформа для автоматизации рекрутинга и подбора персонала в России",
        foundingDate: "2024",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+7 (495) 123-45-67",
          contactType: "customer service",
          email: "support@avtonaim.qbsoft.ru",
        },
        sameAs: [
          "https://t.me/qbs_autonaim",
          "https://hh.ru/employer/XXXXXX", // Заменить на реальный ID работодателя
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://avtonaim.qbsoft.ru/#software",
        name: "QBS Автонайм",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          priceCurrency: "RUB",
          description: "Тарифы от 990₽ в месяц",
        },
        description:
          "AI-платформа для автоматизации найма персонала с интеграцией HH.ru, SuperJob и Telegram",
        featureList: [
          "AI-скрининг резюме",
          "Автоматические интервью через Telegram",
          "Интеграция с HH.ru и SuperJob",
          "Аналитика найма",
          "Корпоративные интеграции",
        ],
        screenshot: "https://avtonaim.qbsoft.ru/screenshot.png",
        author: {
          "@id": "https://avtonaim.qbsoft.ru/#organization",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://docs.avtonaim.qbsoft.ru/#website",
        url: "https://docs.avtonaim.qbsoft.ru",
        name: "Документация QBS Автонайм",
        description:
          "Полная документация AI-платформы для автоматизации рекрутинга",
        inLanguage: "ru-RU",
        publisher: {
          "@id": "https://avtonaim.qbsoft.ru/#organization",
        },
      },
    ],
  };

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            <span
              className="fixed inset-0 pointer-events-none"
              style={{
                backgroundImage: 'url("/background.png")',
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right top",
                backgroundAttachment: "fixed",
              }}
            />
            <DocsHeader />
            <div className="mx-auto flex max-w-7xl">
              <DocsSidebar />
              <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
