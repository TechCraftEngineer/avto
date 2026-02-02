import { useMemo } from "react";

interface Vacancy {
  id: string;
  isActive: boolean | null;
  totalResponsesCount: number | null;
  newResponses: number | null;
}

interface VacanciesStats {
  totalVacancies: number;
  activeVacancies: number;
  totalResponses: number;
  newResponses: number;
}

/**
 * Хук для подсчета статистики по массиву вакансий
 */
export function useVacanciesStats(
  vacancies: Vacancy[] | undefined,
): VacanciesStats {
  return useMemo(() => {
    if (!vacancies || vacancies.length === 0) {
      return {
        totalVacancies: 0,
        activeVacancies: 0,
        totalResponses: 0,
        newResponses: 0,
      };
    }

    return {
      totalVacancies: vacancies.length,
      activeVacancies: vacancies.filter((v) => v.isActive === true).length,
      totalResponses: vacancies.reduce(
        (sum, v) => sum + (v.totalResponsesCount ?? 0),
        0,
      ),
      newResponses: vacancies.reduce(
        (sum, v) => sum + (v.newResponses ?? 0),
        0,
      ),
    };
  }, [vacancies]);
}
