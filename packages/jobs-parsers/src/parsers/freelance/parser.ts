import type { VacancyData } from "../types";
import { FREELANCE_CONFIGS } from "./config";
import type { FreelanceSource, RawFreelanceVacancy } from "./types";

/**
 * Нормализует сырые данные фриланс-вакансии в формат VacancyData
 */
export function normalizeFreelanceVacancy(
  raw: RawFreelanceVacancy,
  source: FreelanceSource,
): VacancyData {
  return {
    id: raw.id,
    externalId: raw.id,
    source,
    title: raw.title,
    url: raw.url,
    responsesUrl: null,
    resumesInProgress: "0",
    suitableResumes: "0",
    // region не указывается для фриланс-вакансий, так как они обычно удаленные
    description: raw.description || "",
  };
}

/**
 * Парсит вакансии с фриланс-платформы
 */
export async function parseFreelanceVacancies(
  source: FreelanceSource,
  rawVacancies: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  const config = FREELANCE_CONFIGS[source];

  console.log(`🚀 Парсинг вакансий с ${config.name}`);
  console.log(`   Найдено вакансий: ${rawVacancies.length}`);

  const vacancies: VacancyData[] = [];
  let failedCount = 0;

  for (let i = 0; i < rawVacancies.length; i++) {
    const raw = rawVacancies[i];
    if (!raw) continue;
    try {
      const normalized = normalizeFreelanceVacancy(raw, source);
      vacancies.push(normalized);
    } catch (error) {
      failedCount++;
      console.error(`❌ Ошибка при нормализации вакансии [${config.name}]:`, {
        source,
        configName: config.name,
        vacancyId: raw?.id || `index-${i}`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(`✅ Обработано вакансий: ${vacancies.length}`);
  if (failedCount > 0) {
    console.warn(`⚠️  Пропущено вакансий с ошибками: ${failedCount}`);
  }

  return vacancies;
}

/**
 * Создает заглушку для вакансии с минимальными данными
 */
export function createFreelanceVacancyStub(
  id: string,
  title: string,
  source: FreelanceSource,
): VacancyData {
  const config = FREELANCE_CONFIGS[source];

  return {
    id,
    externalId: id,
    source,
    title,
    url: `${config.baseUrl}/project/${id}`,
    responsesUrl: null,
    resumesInProgress: "0",
    suitableResumes: "0",
    // region не указывается для фриланс-вакансий
    description: "",
  };
}
