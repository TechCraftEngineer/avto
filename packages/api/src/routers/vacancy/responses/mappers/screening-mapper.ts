import type { ResponseScreening } from "@qbs-autonaim/db/schema";
import { sanitizeHtml } from "../../../utils/sanitize-html";

/**
 * Маппер для преобразования данных скрининга в формат API
 */
export function mapScreeningToOutput(screening: ResponseScreening | null) {
  if (!screening) return null;

  return {
    score: screening.overallScore,
    detailedScore: calculateDetailedScore(screening),
    analysis: screening.overallAnalysis
      ? sanitizeHtml(screening.overallAnalysis)
      : null,
    recommendation: screening.recommendation,
    strengths: screening.strengths ?? [],
    weaknesses: screening.weaknesses ?? [],

    // Детальные оценки
    skillsMatchScore: screening.skillsMatchScore,
    experienceScore: screening.experienceScore,
    priceScore: screening.priceScore,
    deliveryScore: screening.deliveryScore,
    potentialScore: screening.potentialScore,
    careerTrajectoryScore: screening.careerTrajectoryScore,
    psychometricScore: screening.psychometricScore,

    // Анализы
    skillsAnalysis: screening.skillsAnalysis
      ? sanitizeHtml(screening.skillsAnalysis)
      : null,
    experienceAnalysis: screening.experienceAnalysis
      ? sanitizeHtml(screening.experienceAnalysis)
      : null,
    priceAnalysis: screening.priceAnalysis
      ? sanitizeHtml(screening.priceAnalysis)
      : null,
    deliveryAnalysis: screening.deliveryAnalysis
      ? sanitizeHtml(screening.deliveryAnalysis)
      : null,
    potentialAnalysis: screening.potentialAnalysis
      ? sanitizeHtml(screening.potentialAnalysis)
      : null,
    careerTrajectoryAnalysis: screening.careerTrajectoryAnalysis
      ? sanitizeHtml(screening.careerTrajectoryAnalysis)
      : null,
    hiddenFitAnalysis: screening.hiddenFitAnalysis
      ? sanitizeHtml(screening.hiddenFitAnalysis)
      : null,
    rankingAnalysis: screening.rankingAnalysis
      ? sanitizeHtml(screening.rankingAnalysis)
      : null,

    // Дополнительные данные
    careerTrajectoryType: screening.careerTrajectoryType,
    hiddenFitIndicators: screening.hiddenFitIndicators ?? [],
    candidateSummary: screening.candidateSummary,
    rankingPosition: screening.rankingPosition,
    psychometricAnalysis: screening.psychometricAnalysis
      ? {
          compatibilityScore: screening.psychometricAnalysis.compatibilityScore,
          summary:
            screening.psychometricAnalysis.summary == null
              ? null
              : sanitizeHtml(screening.psychometricAnalysis.summary),
          strengths: (screening.psychometricAnalysis.strengths ?? []).map((s) =>
            sanitizeHtml(s),
          ),
          challenges: (screening.psychometricAnalysis.challenges ?? []).map(
            (c) => sanitizeHtml(c),
          ),
          recommendations: (
            screening.psychometricAnalysis.recommendations ?? []
          ).map((r) => sanitizeHtml(r)),
        }
      : null,
  };
}

/**
 * Вычисляет детальную оценку на основе всех компонентов
 */
function calculateDetailedScore(screening: ResponseScreening): number {
  const scores = [
    screening.skillsMatchScore,
    screening.experienceScore,
    screening.priceScore,
    screening.deliveryScore,
    screening.potentialScore,
    screening.careerTrajectoryScore,
    screening.psychometricScore,
  ].filter((score): score is number => score !== null);

  if (scores.length === 0) {
    return screening.overallScore;
  }

  return Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length,
  );
}

/**
 * Вычисляет композитную оценку (для обратной совместимости)
 * @deprecated Используйте screening.overallScore напрямую
 */
export function calculateCompositeScore(
  screening: ResponseScreening | null,
): number {
  return screening?.overallScore ?? 0;
}
