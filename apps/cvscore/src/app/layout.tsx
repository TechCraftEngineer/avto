import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type React from "react";
import { KEYWORDS, SITE_CONFIG } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default:
      "CVScore — AI-скрининг кандидата за 30 секунд | Оценка резюме онлайн",
    template: "%s | CVScore",
  },
  description: SITE_CONFIG.description,
  keywords: [...KEYWORDS],
  authors: [{ name: "QBS", url: "https://qbsoft.ru" }],
  creator: "QBS",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: "CVScore — AI-оценка кандидата по резюме за 30 секунд",
    description: SITE_CONFIG.shortDescription,
  },
  twitter: {
    card: "summary",
    title: "CVScore — AI-скрининг кандидата за 30 секунд",
    description: SITE_CONFIG.shortDescription,
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
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  icons: {
    icon: "/icon.svg",
  },
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "ru",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "RUB",
      description: "Бесплатное использование",
    },
    featureList: [
      "AI-оценка кандидата по резюме",
      "Сильные стороны и риски",
      "Вопросы для собеседования",
      "Результат за 10–20 секунд",
    ],
  };

  return (
    <html lang="ru" className={geistSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.className} antialiased`}>{children}</body>
    </html>
  );
}
