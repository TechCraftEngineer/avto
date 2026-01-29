import { Metadata } from "next"

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  noIndex?: boolean
  canonical?: string
}

const defaultMetadata = {
  siteName: "QBS Автонайм",
  defaultTitle: "QBS Автонайм — AI-платформа автоматизации подбора персонала",
  defaultDescription:
    "Автоматизируйте подбор персонала с помощью искусственного интеллекта. AI-скрининг резюме, голосовые интервью в Telegram, интеграция с hh.ru. Сократите время найма на 70%.",
  siteUrl: "https://avtonaim.qbs.ru",
  ogImage: "/og-image.png",
  twitterHandle: "@qbs_autonaim",
}

export function generateSEO({
  title,
  description,
  keywords = [],
  ogImage,
  noIndex = false,
  canonical,
}: SEOProps = {}): Metadata {
  const pageTitle = title
    ? `${title} | ${defaultMetadata.siteName}`
    : defaultMetadata.defaultTitle

  const pageDescription = description || defaultMetadata.defaultDescription
  const pageOgImage = ogImage || defaultMetadata.ogImage
  const pageCanonical = canonical
    ? `${defaultMetadata.siteUrl}${canonical}`
    : undefined

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: pageCanonical
      ? {
          canonical: pageCanonical,
        }
      : undefined,
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: pageCanonical || defaultMetadata.siteUrl,
      siteName: defaultMetadata.siteName,
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: pageOgImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [pageOgImage],
      creator: defaultMetadata.twitterHandle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
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
  }
}

// Структурированные данные для разных типов страниц
export const structuredData = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QBS",
    legalName: "QBS Автонайм",
    url: "https://avtonaim.qbs.ru",
    logo: "https://avtonaim.qbs.ru/logo.png",
    description:
      "AI-платформа для автоматизации найма персонала. Интеграция с HH.ru и Telegram.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "RU",
      addressLocality: "Москва",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Служба поддержки",
      email: "support@avtonaim.qbs.ru",
      availableLanguage: ["Russian"],
    },
    sameAs: [
      "https://t.me/qbs_autonaim",
      "https://vk.com/qbs_autonaim",
      "https://linkedin.com/company/qbs-autonaim",
    ],
  },

  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QBS Автонайм",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-платформа для автоматизации найма персонала. Интеграция с HH.ru и Telegram.",
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
    featureList: [
      "AI-скрининг резюме",
      "Голосовые интервью в Telegram",
      "Интеграция с HH.ru",
      "Автоматическая оценка кандидатов",
      "Аналитика и отчеты",
    ],
  },

  faqPage: (faqs: Array<{ question: string; answer: string }>) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }),

  article: (article: {
    title: string
    description: string
    author: string
    datePublished: string
    dateModified?: string
    image?: string
  }) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "QBS Автонайм",
      logo: {
        "@type": "ImageObject",
        url: "https://avtonaim.qbs.ru/logo.png",
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image || "https://avtonaim.qbs.ru/og-image.png",
  }),

  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://avtonaim.qbs.ru${item.url}`,
    })),
  }),
}
