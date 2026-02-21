/**
 * Типы событий истории откликов
 */

export const responseEventTypeValues = [
  "STATUS_CHANGED",
  "HR_STATUS_CHANGED",
  "TELEGRAM_USERNAME_ADDED",
  "CHAT_ID_ADDED",
  "PHONE_ADDED",
  "EMAIL_ADDED",
  "RESUME_UPDATED",
  "PHOTO_ADDED",
  "WELCOME_SENT",
  "OFFER_SENT",
  "COMMENT_ADDED",
  "SALARY_UPDATED",
  "CONTACT_INFO_UPDATED",
  "CREATED",
  "SCREENING_COMPLETED",
  "INTERVIEW_STARTED",
  "INTERVIEW_COMPLETED",
  "CANDIDATE_LINKED",
] as const;

export type ResponseEventType = (typeof responseEventTypeValues)[number];
