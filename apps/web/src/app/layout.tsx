import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ 
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({ 
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-mono",
})


export const metadata: Metadata = {
  title: "QBS Автонайм — AI-платформа автоматизации подбора персонала | Рекрутинг с ИИ",
  description:
    "Автоматизируйте подбор персонала с помощью искусственного интеллекта. AI-скрининг резюме, голосовые интервью в Telegram, интеграция с hh.ru. Сократите время найма на 70%. Бесплатный старт.",
  keywords: [
    "автоматизация найма",
    "AI рекрутинг",
    "подбор персонала",
    "HR автоматизация",
    "искусственный интеллект HR",
    "автонайм",
    "рекрутинг бот",
    "HH.ru интеграция",
    "Telegram рекрутинг",
    "скрининг кандидатов",
    "автоматический подбор персонала",
    "AI HR",
    "умный рекрутинг",
    "автоматизация HR",
    "бот для найма",
  ],
  authors: [{ name: "QBS" }],
  creator: "QBS",
  publisher: "QBS",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://avtonaim.qbs.ru",
    siteName: "QBS Автонайм",
    title: "QBS Автонайм — Автоматизация подбора персонала с ИИ",
    description: "AI-скрининг резюме, голосовые интервью, интеграция с hh.ru. Сократите время найма на 70%.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QBS Автонайм — AI платформа для найма",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QBS Автонайм — AI-платформа для автоматизации найма",
    description: "Автоматизируйте подбор персонала с помощью ИИ. Экономьте до 90% времени на рутине.",
    images: ["/og-image.png"],
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
}

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "QBS Автонайм",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "AI-платформа для автоматизации найма персонала. Интеграция с HH.ru и Telegram.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "RUB",
                description: "Бесплатный тариф до 50 кандидатов в месяц",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                ratingCount: "127",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
