/**
 * Типизированные события PostHog для аналитики
 */

export const POSTHOG_EVENTS = {
  // Вакансии
  VACANCY_CREATED: "vacancy_created",
  VACANCY_UPDATED: "vacancy_updated",
  VACANCY_DELETED: "vacancy_deleted",
  VACANCY_PUBLISHED: "vacancy_published",

  // Кандидаты
  CANDIDATE_VIEWED: "candidate_viewed",
  CANDIDATE_INVITED: "candidate_invited",
  CANDIDATE_REJECTED: "candidate_rejected",
  CANDIDATE_MOVED_STAGE: "candidate_moved_stage",

  // Чат
  CHAT_MESSAGE_SENT: "chat_message_sent",
  CHAT_OPENED: "chat_opened",

  // Интервью
  INTERVIEW_STARTED: "interview_started",
  INTERVIEW_COMPLETED: "interview_completed",

  // Организация
  ORGANIZATION_CREATED: "organization_created",
  MEMBER_INVITED: "member_invited",

  // Интеграции
  INTEGRATION_CONNECTED: "integration_connected",
  INTEGRATION_DISCONNECTED: "integration_disconnected",

  // Заявки кандидатов (воронка откликов)
  APPLICATION_STARTED: "application_started",
  APPLICATION_FORM_VIEWED: "application_form_viewed",
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_ERROR: "application_error",
  APPLICATION_ABANDONED: "application_abandoned",
  APPLICATION_DRAFT_SAVED: "application_draft_saved",
} as const;

export type PostHogEvent = (typeof POSTHOG_EVENTS)[keyof typeof POSTHOG_EVENTS];
