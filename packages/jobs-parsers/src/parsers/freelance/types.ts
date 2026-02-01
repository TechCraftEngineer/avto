/**
 * Типы для фриланс-платформ (Kwork, FL.ru, Freelance.ru)
 */

export const FREELANCE_SOURCES = ["kwork", "fl", "freelance"] as const;

export type FreelanceSource = (typeof FREELANCE_SOURCES)[number];

/**
 * Сырые данные вакансии с фриланс-платформы
 */
export interface RawFreelanceVacancy {
  id: string;
  title: string;
  url: string;
  description?: string;
  budget?: string;
  deadline?: string;
  category?: string;
  publishedAt?: string;
  [key: string]: unknown;
}

/**
 * Конфигурация для парсера фриланс-платформы
 */
export interface FreelancePlatformConfig {
  name: string;
  baseUrl: string;
  vacanciesUrl: string;
}
