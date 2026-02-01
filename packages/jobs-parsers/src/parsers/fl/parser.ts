import {
  FREELANCE_CONFIGS,
  normalizeFreelanceVacancy,
  type RawFreelanceVacancy,
} from "../freelance";
import type { VacancyData } from "../types";

/**
 * Парсит вакансии с FL.ru
 */
export async function parseFlVacancies(
  rawVacancies: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  const config = FREELANCE_CONFIGS.fl;

  console.log(`🚀 Парсинг вакансий с ${config.name}`);

  const vacancies: VacancyData[] = [];
  let failedCount = 0;

  for (let i = 0; i < rawVacancies.length; i++) {
    const raw = rawVacancies[i];
    if (!raw) continue;

    try {
      const normalized = normalizeFreelanceVacancy(raw, "fl");
      vacancies.push(normalized);
    } catch (error) {
      failedCount++;
      console.error(
        `❌ Ошибка нормализации вакансии [индекс: ${i}, id: ${raw.id || "unknown"}, заголовок: "${raw.title?.slice(0, 50) || "N/A"}..."]:`,
        error,
      );
    }
  }

  console.log(
    `✅ Успешно обработано: ${vacancies.length}, ошибок: ${failedCount}`,
  );

  return vacancies;
}
