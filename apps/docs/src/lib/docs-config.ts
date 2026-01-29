export interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
  label?: string;
  external?: boolean;
}

export interface DocsConfig {
  sidebarNav: NavItem[];
}

export const docsConfig: DocsConfig = {
  sidebarNav: [
    {
      title: "Начало работы",
      items: [
        { title: "Введение в QBS Автонайм", href: "/" },
        { title: "Быстрый старт за 10 минут", href: "/quickstart" },
        { title: "Глоссарий терминов", href: "/glossary" },
        { title: "Цены и тарифы", href: "/pricing" },
      ],
    },
    {
      title: "Управление",
      items: [
        { title: "Организации", href: "/organizations" },
        { title: "Рабочие пространства", href: "/organizations/workspaces" },
      ],
    },
    {
      title: "Работа с кандидатами",
      items: [
        { title: "Обзор раздела Кандидаты", href: "/candidates" },
        { title: "AI-скрининг резюме", href: "/candidates/screening" },
        { title: "Система скоринга", href: "/candidates/scoring" },
        { title: "Воронка найма", href: "/candidates/pipeline" },
        { title: "Gig-задания для фрилансеров", href: "/candidates/gig" },
        { title: "Голосовые резюме", href: "/candidates/voice" },
      ],
    },
    {
      title: "AI-ассистент",
      items: [
        { title: "Обзор возможностей AI", href: "/ai-assistant" },
        { title: "Чат с кандидатами", href: "/ai-assistant/chat" },
        { title: "Автоматические ответы", href: "/ai-assistant/auto-replies" },
        { title: "Шаблоны сообщений", href: "/ai-assistant/templates" },
        {
          title: "Настройка сценариев интервью",
          href: "/ai-assistant/scenarios",
        },
      ],
    },
    {
      title: "Аналитика и отчёты",
      items: [
        { title: "Обзор аналитики", href: "/analytics" },
        { title: "Отчёты по найму", href: "/analytics/reports" },
        { title: "Метрики эффективности", href: "/analytics/metrics" },
        { title: "ROI рекрутинга", href: "/analytics/roi" },
      ],
    },
    {
      title: "Интеграции",
      items: [
        { title: "Обзор интеграций", href: "/integrations" },
        { title: "HeadHunter (HH.ru)", href: "/integrations/hh" },
        { title: "Telegram-боты", href: "/integrations/telegram" },
        { title: "Фриланс-платформы", href: "/integrations/freelance" },
      ],
    },
    {
      title: "Помощь и поддержка",
      items: [
        { title: "Часто задаваемые вопросы", href: "/help/faq" },
        { title: "Видео-инструкции", href: "/help/videos" },
        { title: "База знаний", href: "/help/knowledge-base" },
      ],
    },
  ],
};
