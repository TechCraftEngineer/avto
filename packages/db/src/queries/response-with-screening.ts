/**
 * Helper для работы с откликами и их оценками
 * После рефакторинга все оценки хранятся в response_screenings
 */

import { eq, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { response } from "../schema/response/response";
import { responseScreening } from "../schema/response/response-screening";

/**
 * Тип отклика с данными скрининга
 */
export type ResponseWithScreening = typeof response.$inferSelect & {
  screening: typeof responseScreening.$inferSelect | null;
};

/**
 * Добавляет JOIN с response_screenings к запросу
 *
 * @example
 * const query = db.select().from(response);
 * const withScreening = addScreeningJoin(query);
 * const results = await withScreening.where(eq(response.id, responseId));
 */
export function addScreeningJoin<T extends PgSelect>(query: T) {
  return query.leftJoin(
    responseScreening,
    eq(response.id, responseScreening.responseId),
  );
}

/**
 * Стандартный SELECT для отклика с оценками
 * Используйте это вместо прямого обращения к полям
 */
export const responseWithScreeningSelect = {
  // Все поля отклика
  ...response,

  // Данные скрининга как вложенный объект
  screening: responseScreening,
} as const;

/**
 * Маппинг старых полей на новые (для обратной совместимости)
 * Используйте в SELECT для получения данных в старом формате
 */
export const legacyResponseFields = {
  // Основные поля отклика
  id: response.id,
  entityType: response.entityType,
  entityId: response.entityId,
  candidateId: response.candidateId,
  candidateName: response.candidateName,
  status: response.status,
  hrSelectionStatus: response.hrSelectionStatus,

  // Оценки из screening (с алиасами для совместимости)
  compositeScore: responseScreening.overallScore,
  skillsMatchScore: responseScreening.skillsMatchScore,
  experienceScore: responseScreening.experienceScore,
  priceScore: responseScreening.priceScore,
  deliveryScore: responseScreening.deliveryScore,

  // Анализы из screening
  compositeScoreReasoning: responseScreening.overallAnalysis,
  skillsMatchScoreReasoning: responseScreening.skillsAnalysis,
  experienceScoreReasoning: responseScreening.experienceAnalysis,
  priceScoreReasoning: responseScreening.priceAnalysis,
  deliveryScoreReasoning: responseScreening.deliveryAnalysis,

  // Дополнительные поля из screening
  strengths: responseScreening.strengths,
  weaknesses: responseScreening.weaknesses,
  recommendation: responseScreening.recommendation,
  rankingPosition: responseScreening.rankingPosition,
  rankingAnalysis: responseScreening.rankingAnalysis,
  candidateSummary: responseScreening.candidateSummary,
  rankedAt: responseScreening.screenedAt,

  // Метаданные
  createdAt: response.createdAt,
  updatedAt: response.updatedAt,
} as const;

/**
 * SQL фрагмент для сортировки по оценке
 * Используйте вместо прямого обращения к полям
 */
export const orderByScore = sql`${responseScreening.overallScore} DESC NULLS LAST`;

/**
 * SQL фрагмент для сортировки по позиции в рейтинге
 */
export const orderByRanking = sql`${responseScreening.rankingPosition} ASC NULLS LAST`;

/**
 * SQL фрагмент для фильтрации по наличию оценки
 */
export const hasScreening = sql`${responseScreening.overallScore} IS NOT NULL`;

/**
 * Типы для обратной совместимости
 */
export type LegacyResponseWithScores = {
  id: string;
  entityType: string;
  entityId: string;
  candidateId: string;
  candidateName: string | null;
  status: string;
  hrSelectionStatus: string | null;

  // Оценки (теперь из screening)
  compositeScore: number | null;
  skillsMatchScore: number | null;
  experienceScore: number | null;
  priceScore: number | null;
  deliveryScore: number | null;

  // Анализы
  compositeScoreReasoning: string | null;
  skillsMatchScoreReasoning: string | null;
  experienceScoreReasoning: string | null;
  priceScoreReasoning: string | null;
  deliveryScoreReasoning: string | null;

  // Дополнительные поля
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendation: string | null;
  rankingPosition: number | null;
  rankingAnalysis: string | null;
  candidateSummary: string | null;
  rankedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
};
