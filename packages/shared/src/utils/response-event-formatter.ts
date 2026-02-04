/**
 * Утилиты для форматирования событий истории откликов
 */

import type { ResponseEventType } from "@qbs-autonaim/db/schema";

/**
 * Получает человекочитаемое название события отклика
 *
 * @param eventType - Тип события из ResponseEventType
 * @param newValue - Новое значение (опционально, используется для некоторых типов событий)
 * @returns Форматированное название события
 *
 * @example
 * ```ts
 * getResponseEventTitle("CREATED") // "Отклик создан"
 * getResponseEventTitle("STATUS_CHANGED", "in_progress") // "Статус изменен на in_progress"
 * getResponseEventTitle("PHONE_ADDED") // "Телефон добавлен"
 * ```
 */
export function getResponseEventTitle(
  eventType: ResponseEventType | string,
  newValue?: unknown,
): string {
  switch (eventType) {
    case "CREATED":
      return "Отклик создан";
    case "STATUS_CHANGED":
      return `Статус изменен на ${newValue || "неизвестный"}`;
    case "HR_STATUS_CHANGED":
      return `HR статус изменен на ${newValue || "неизвестный"}`;
    case "WELCOME_SENT":
      return "Приветственное сообщение отправлено";
    case "OFFER_SENT":
      return "Предложение отправлено";
    case "SCREENING_COMPLETED":
      return "Скрининг завершен";
    case "INTERVIEW_STARTED":
      return "Собеседование начато";
    case "INTERVIEW_COMPLETED":
      return "Собеседование завершено";
    case "RESUME_UPDATED":
      return "Резюме обновлено";
    case "PHONE_ADDED":
      return "Телефон добавлен";
    case "EMAIL_ADDED":
      return "Email добавлен";
    case "COMMENT_ADDED":
      return "Комментарий добавлен";
    case "SALARY_UPDATED":
      return "Зарплата обновлена";
    case "TELEGRAM_USERNAME_ADDED":
      return "Telegram username добавлен";
    case "CHAT_ID_ADDED":
      return "Chat ID добавлен";
    case "PHOTO_ADDED":
      return "Фото добавлено";
    case "CONTACT_INFO_UPDATED":
      return "Контактная информация обновлена";
    case "CANDIDATE_LINKED":
      return "Кандидат привязан";
    default:
      // Fallback для неизвестных типов событий
      return eventType.replace(/_/g, " ").toLowerCase();
  }
}
