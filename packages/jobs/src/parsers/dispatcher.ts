import { parseFlVacancies } from "./fl";
import type { RawFreelanceVacancy } from "./freelance";
import { FREELANCE_SOURCES, type FreelanceSource } from "./freelance/types";
import type { VacancyData } from "./types";

/**
 * Список поддерживаемых источников вакансий
 */
export const VACANCY_SOURCES = [
  "hh",
  "avito",
  "superjob",
  "fl",
  "freelance",
] as const;

/**
 * Тип источника вакансии
 */
export type VacancySource = (typeof VACANCY_SOURCES)[number];

/**
 * Парсит вакансии в зависимости от источника
 */
export async function parseVacanciesBySource(
  source: VacancySource,
  rawData: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  switch (source) {
    case "fl":
      return parseFlVacancies(rawData);
    case "freelance":
      // Freelance.ru использует тот же формат что и FL.ru
      return parseFlVacancies(rawData);
    case "hh":
    case "avito":
    case "superjob":
      throw new Error(
        `Парсер для ${source} должен вызываться напрямую, а не через диспетчер`,
      );
    default:
      throw new Error(`Неизвестный источник вакансий: ${source}`);
  }
}

/**
 * Проверяет, поддерживается ли источник
 */
export function isVacancySourceSupported(
  source: string,
): source is VacancySource {
  return VACANCY_SOURCES.includes(source as VacancySource);
}

/**
 * Проверяет, является ли источник фриланс-платформой
 */
export function isFreelancePlatform(
  source: VacancySource,
): source is FreelanceSource {
  return FREELANCE_SOURCES.includes(source as FreelanceSource);
}
