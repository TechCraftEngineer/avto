import { useMemo } from "react";

export interface VacancyStatsFromApi {
  totalVacancies: number;
  activeVacancies: number;
  totalResponses: number;
  newResponses: number;
}

interface Vacancy {
  id: string;
  isActive: boolean | null;
  totalResponsesCount: number | null;
  newResponses: number | null;
}

export interface VacanciesStats {
  totalVacancies: number;
  activeVacancies: number;
  totalResponses: number;
  newResponses: number;
}

/**
 * Хук для отображения статистики по вакансиям.
 * Предпочитает stats из API (при первом запросе без фильтров),
 * иначе вычисляет из текущей страницы (fallback).
 */
export function useVacanciesStats(
  apiStats: VacancyStatsFromApi | undefined,
  vacanciesFallback: Vacancy[] | undefined,
): VacanciesStats {
  return useMemo(() => {
    if (apiStats) {
      return apiStats;
    }
    if (!vacanciesFallback || vacanciesFallback.length === 0) {
      return {
        totalVacancies: 0,
        activeVacancies: 0,
        totalResponses: 0,
        newResponses: 0,
      };
    }
    return {
      totalVacancies: vacanciesFallback.length,
      activeVacancies: vacanciesFallback.filter((v) => v.isActive === true)
        .length,
      totalResponses: vacanciesFallback.reduce(
        (sum, v) => sum + (v.totalResponsesCount ?? 0),
        0,
      ),
      newResponses: vacanciesFallback.reduce(
        (sum, v) => sum + (v.newResponses ?? 0),
        0,
      ),
    };
  }, [apiStats, vacanciesFallback]);
}
