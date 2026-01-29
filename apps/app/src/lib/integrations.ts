export const INTEGRATION_CATEGORIES = {
  JOB_SEARCH: {
    id: "job-search",
    name: "Поиск работы",
    description: "Интеграции для автоматизации поиска и откликов на вакансии",
    icon: "briefcase",
  },
  COMMUNICATION: {
    id: "communication",
    name: "Коммуникация",
    description: "Интеграции для общения с работодателями и рекрутерами",
    icon: "message-circle",
  },
} as const;

export const AVAILABLE_INTEGRATIONS = [
  {
    type: "hh",
    name: "HeadHunter",
    description: "Автоматизация откликов на вакансии на hh.ru",
    detailedDescription:
      "Подключите свой аккаунт HeadHunter для автоматического поиска и отклика на подходящие вакансии. Система будет анализировать вакансии и отправлять отклики от вашего имени.",
    fields: ["email", "password"],
    category: "job-search" as const,
    requiresTelegram: true,
    telegramUsage:
      "Telegram используется для получения уведомлений о новых вакансиях и откликах",
  },
] as const;

export type IntegrationType = (typeof AVAILABLE_INTEGRATIONS)[number]["type"];
