import {
  FREELANCE_CONFIGS,
  normalizeFreelanceVacancy,
  type RawFreelanceVacancy,
} from "../freelance";
import type { VacancyData } from "../types";

/**
 * Парсит вакансии с Kwork
 */
export async function parseKworkVacancies(
  rawVacancies: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  const config = FREELANCE_CONFIGS.kwork;

  console.log(`🚀 Парсинг вакансий с ${config.name}`);

  const vacancies = rawVacancies.map((raw) =>
    normalizeFreelanceVacancy(raw, "kwork"),
  );

  return vacancies;
}
