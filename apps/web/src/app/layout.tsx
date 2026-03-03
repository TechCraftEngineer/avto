import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { YandexMetrika } from "@/components/yandex-metrika"
import { SITE_CONFIG } from "@/lib/seo-constants"
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
  metadataBase: new URL(SITE_CONFIG.url),
  title: "QBS Автонайм — автоматизация подбора персонала | Скрининг резюме, HeadHunter, SuperJob",
  description:
    "Система автоматизации подбора персонала для российского рынка. Скрининг резюме за секунды, интервью в веб-чате, интеграция с hh.ru и SuperJob. Соответствие 152-ФЗ. Бесплатный тариф.",
  keywords: [
    "подбор персонала",
    "автоматизация подбора персонала",
    "скрининг резюме",
    "рекрутинг",
    "система подбора персонала",
    "HeadHunter интеграция",
    "hh.ru автоматизация",
    "SuperJob",
    "подбор сотрудников",
    "HR-автоматизация",
    "автоматизация найма",
    "программа для подбора персонала",
    "скрининг кандидатов",
    "веб-чат интервью",
    "автоматический отбор резюме",
    "как ускорить подбор персонала",
  ],
  authors: [{ name: "QBS" }],
  creator: "QBS",
  publisher: "QBS",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://avtonaim.qbsoft.ru",
    siteName: "QBS Автонайм",
    title: "QBS Автонайм — автоматизация подбора персонала и скрининга резюме",
    description: "Автоматизация подбора персонала: скрининг резюме, интеграция с HeadHunter и SuperJob, интервью в веб-чате. Для российского рынка. Соответствие 152-ФЗ.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QBS Автонайм — автоматизация подбора персонала и скрининга резюме",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QBS Автонайм — автоматизация подбора персонала в России",
    description: "Скрининг резюме, HeadHunter, SuperJob, веб-чат интервью. Автоматизация найма для HR-команд.",
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
                inLanguage: "ru",
                description: "Система автоматизации подбора персонала. Скрининг резюме, интеграция с HeadHunter, SuperJob, интервью в веб-чате. Для HR-команд в России. Соответствие 152-ФЗ о персональных данных.",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "RUB",
                  description: "Бесплатный тариф для тестирования",
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.9",
                  ratingCount: "127",
                  bestRating: "5",
                },
              }),
            }}
        />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <YandexMetrika />
        {children}
      </body>
    </html>
  )
}
