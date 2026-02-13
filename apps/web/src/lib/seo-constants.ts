/**
 * Константы для SEO
 */

export const SITE_CONFIG = {
  name: "QBS Автонайм",
  url: "https://avtonaim.qbsoft.ru",
  ogImage: "/og-image.png",
  description:
    "Автоматизируйте подбор персонала с помощью искусственного интеллекта. AI-скрининг резюме, голосовые интервью в Telegram, интеграция с hh.ru.",
  links: {
    telegram: "https://t.me/qbs_autonaim",
    vk: "https://vk.com/qbs_autonaim",
    linkedin: "https://linkedin.com/company/qbs-autonaim",
  },
} as const

export const COMMON_KEYWORDS = [
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
] as const

export const INDUSTRY_KEYWORDS = {
  it: [
    "найм IT специалистов",
    "подбор разработчиков",
    "рекрутинг программистов",
  ],
  retail: [
    "найм в ритейл",
    "подбор продавцов",
    "массовый подбор персонала",
  ],
  hospitality: [
    "найм в HoReCa",
    "подбор официантов",
    "рекрутинг в гостиничный бизнес",
  ],
  logistics: [
    "найм водителей",
    "подбор курьеров",
    "рекрутинг в логистику",
  ],
} as const

export const FEATURE_KEYWORDS = {
  aiScreening: [
    "AI скрининг резюме",
    "автоматический анализ резюме",
    "искусственный интеллект для отбора",
  ],
  voiceInterview: [
    "голосовые интервью",
    "автоматические собеседования",
    "интервью в Telegram",
  ],
  hhIntegration: [
    "интеграция с HH.ru",
    "автоматизация HeadHunter",
    "парсинг резюме HH",
  ],
  analytics: [
    "аналитика найма",
    "отчеты по подбору",
    "метрики рекрутинга",
  ],
} as const
