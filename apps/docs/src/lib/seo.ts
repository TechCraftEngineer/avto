import type { Metadata } from "next";

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
}

export function generateSEO(page: PageSEO): Metadata {
  const baseUrl = "https://docs.avtonaim.qbsoft.ru";
  const url = page.url ? `${baseUrl}${page.url}` : baseUrl;

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    authors: page.authors?.map((name) => ({ name })),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: "Документация QBS Автонайм",
      images: [
        {
          url: page.image || "/og-image.png",
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
      locale: "ru_RU",
      type: page.type || "website",
      ...(page.publishedTime && { publishedTime: page.publishedTime }),
      ...(page.modifiedTime && { modifiedTime: page.modifiedTime }),
      ...(page.section && { section: page.section }),
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [page.image || "/og-image.png"],
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
  };
}

// Предустановленные SEO конфигурации для разных типов страниц
export const seoConfigs = {
  home: {
    title: "Документация QBS Автонайм — AI для автоматизации рекрутинга",
    description:
      "Полная документация AI-платформы для автоматизации найма персонала. Интеграция с HH.ru, SuperJob, Telegram. AI-скрининг резюме, автоматические интервью, аналитика найма.",
    keywords: [
      "рекрутинг",
      "HR AI",
      "автоматизация найма",
      "HH.ru интеграция",
      "SuperJob",
      "Telegram бот",
      "скрининг резюме AI",
      "интервью кандидатов",
      "HR аналитика",
      "подбор персонала",
      "документация",
      "рекрутер софт",
    ],
  },

  quickstart: {
    title: "Быстрый старт QBS Автонайм — настройка за 5 минут",
    description:
      "Пошаговое руководство по быстрой настройке AI-платформы для рекрутинга. Подключение HH.ru, создание вакансий, запуск AI-скрининга кандидатов.",
    keywords: [
      "настройка QBS Автонайм",
      "быстрый старт рекрутинг",
      "подключение HH.ru",
      "создание вакансий",
      "AI скрининг настройка",
      "автоматизация найма старт",
    ],
  },

  screening: {
    title: "AI-скрининг резюме — автоматический отбор кандидатов",
    description:
      "Как работает AI-скрининг резюме в QBS Автонайм. Автоматическая оценка кандидатов, настройка критериев, повышение эффективности найма до 80%.",
    keywords: [
      "AI скрининг резюме",
      "автоматический отбор кандидатов",
      "оценка резюме AI",
      "критерии скрининга",
      "эффективность рекрутинга",
      "автоматизация HR",
    ],
  },

  hhIntegration: {
    title: "Интеграция с HH.ru — синхронизация вакансий и откликов",
    description:
      "Подключение интеграции с HeadHunter. Автоматический импорт вакансий и кандидатов, синхронизация статусов, управление откликами из QBS Автонайм.",
    keywords: [
      "интеграция HH.ru",
      "HeadHunter API",
      "синхронизация вакансий",
      "импорт кандидатов",
      "управление откликами",
      "автоматизация рекрутинга",
    ],
  },

  aiAssistant: {
    title: "AI-ассистент рекрутера — чат и автоответы кандидатам",
    description:
      "AI-ассистент для проведения интервью через Telegram и веб-интерфейс. Автоматические ответы, чат с кандидатами, шаблоны сообщений, повышение качества найма.",
    keywords: [
      "AI ассистент рекрутер",
      "чат с кандидатами",
      "автоматические интервью",
      "Telegram бот найм",
      "шаблоны сообщений HR",
      "автоответы кандидатам",
    ],
  },

  analytics: {
    title: "Аналитика найма — метрики и отчёты по эффективности рекрутинга",
    description:
      "Аналитика HR-процессов в QBS Автонайм. Метрики найма, конверсия воронки, время закрытия вакансий, ROI рекрутинга, отчёты для руководства.",
    keywords: [
      "аналитика рекрутинга",
      "метрики найма",
      "HR отчёты",
      "конверсия воронки",
      "ROI рекрутинга",
      "эффективность подбора",
    ],
  },

  "knowledge-base": {
    title: "База знаний QBS Автонайм — статьи и гайды по рекрутингу",
    description:
      "База знаний по AI-рекрутингу. Статьи о лучших практиках найма, кейсы компаний, советы по работе с кандидатами. Полезные материалы для HR.",
    keywords: [
      "база знаний HR",
      "статьи о рекрутинге",
      "лучшие практики найма",
      "кейсы компаний",
      "гайды по AI HR",
      "советы рекрутерам",
    ],
  },

  organizations: {
    title: "Организации в QBS Автонайм — управление командой и доступом",
    description:
      "Управление организацией в QBS Автонайм. Создание пространств, приглашение участников, настройка ролей и прав доступа, управление биллингом.",
    keywords: [
      "организация QBS",
      "управление командой",
      "роли и права доступа",
      "биллинг рекрутинг",
      "рабочие пространства",
      "участники организации",
    ],
  },

  workspaces: {
    title: "Рабочие пространства — изолированные среды для команд",
    description:
      "Рабочие пространства в QBS Автонайм для организации работы команд. Создание пространств, управление участниками, настройка интеграций и AI-инструментов.",
    keywords: [
      "рабочие пространства QBS",
      "управление командами",
      "изолированные пространства",
      "настройка пространства",
      "участники пространства",
      "организация работы HR",
    ],
  },

  faq: {
    title: "Часто задаваемые вопросы — QBS Автонайм",
    description:
      "Ответы на часто задаваемые вопросы о QBS Автонайм. AI-рекрутинг, интеграции, настройка, поддержка.",
    keywords: [
      "FAQ QBS Автонайм",
      "вопросы и ответы",
      "поддержка рекрутинга",
      "помощь AI найм",
    ],
  },
};

// Функция для генерации SEO с предустановками
export function generatePageSEO(
  pageKey: keyof typeof seoConfigs,
  overrides?: Partial<PageSEO>,
): Metadata {
  const baseConfig = seoConfigs[pageKey];
  return generateSEO({ ...baseConfig, ...overrides });
}
