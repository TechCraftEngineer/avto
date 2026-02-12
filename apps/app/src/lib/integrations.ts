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
  },
  {
    type: "avito",
    name: "Avito",
    description: "Автоматизация откликов на вакансии на Avito",
    detailedDescription:
      "Подключите свой аккаунт Avito для автоматического поиска и отклика на подходящие вакансии. Система будет анализировать вакансии и отправлять отклики от вашего имени.",
    fields: ["email", "password"],
    category: "job-search" as const,
  },
  {
    type: "superjob",
    name: "SuperJob",
    description: "Автоматизация откликов на вакансии на SuperJob",
    detailedDescription:
      "Подключите свой аккаунт SuperJob для автоматического поиска и отклика на подходящие вакансии. Система будет анализировать вакансии и отправлять отклики от вашего имени.",
    fields: ["email", "password"],
    category: "job-search" as const,
  },
  {
    type: "kwork",
    name: "Kwork",
    description: "Автоматизация откликов на заказы на Kwork.ru",
    detailedDescription:
      "Подключите свой аккаунт Kwork для автоматического поиска и отклика на подходящие заказы. Система будет анализировать заказы и отправлять предложения от вашего имени.",
    fields: ["email", "password"],
    category: "job-search" as const,
  },
] as const;

export type IntegrationType = (typeof AVAILABLE_INTEGRATIONS)[number]["type"];
