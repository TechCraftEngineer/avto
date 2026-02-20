/**
 * Типы для gig заданий
 */

/**
 * Контактная информация кандидата
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  telegram?: string;
  platformProfile?: string;
}

/**
 * Базовые данные gig задания
 */
export interface BaseGigData {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  estimatedDuration: string | null;
  deadline: Date | null;
}

/**
 * Расширенные данные gig с кастомными настройками
 */
export interface ExtendedGigData extends BaseGigData {
  customBotInstructions: string | null;
  customScreeningPrompt?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  requirements?: unknown;
}

/**
 * Контекст gig для UI компонентов
 */
export interface GigContextData {
  id: string;
  title: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: Date | null;
  estimatedDuration: string | null;
  requiredSkills: string[];
}
