/**
 * Общие типы для prequalification и evaluation
 * Централизованный источник для избежания дублирования
 */

import type { VacancyRequirements } from "@qbs-autonaim/types";

/**
 * Сообщение в диалоге с кандидатом
 */
export interface DialogueMessage {
  /** Роль отправителя */
  role: "assistant" | "user";
  /** Текст сообщения */
  content: string;
  /** Время отправки */
  timestamp: Date;
}

/**
 * Данные вакансии для оценки
 */
export interface VacancyData {
  /** ID вакансии */
  id: string;
  /** Название вакансии */
  title: string;
  /** Описание вакансии */
  description?: string;
  /** Требования к кандидату */
  requirements?: VacancyRequirements;
}
