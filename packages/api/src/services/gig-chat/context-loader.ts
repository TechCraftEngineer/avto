/**
 * Gig AI Chat Context Loaders
 *
 * Сервисы для загрузки контекста gig задания и кандидатов для AI чата.
 */

import {
  and,
  eq,
  gig,
  interviewScoring,
  responseScreening,
  response as responseTable,
} from "@qbs-autonaim/db";
import type { db } from "@qbs-autonaim/db/client";

/**
 * Контекст gig задания
 */
export interface GigContext {
  id: string;
  title: string;
  description: string | null;
  requirements: {
    title: string;
    summary: string;
    deliverables: string[];
    required_skills: string[];
    nice_to_have_skills: string[];
    tech_stack: string[];
    experience_level: string;
    languages: Array<{
      language: string;
      level: string;
    }>;
    keywords_for_matching: string[];
  } | null;
  type: string;
  budgetMin: number | null;
  budgetMax: number | null;

  deadline: Date | null;
  estimatedDuration: string | null;
  customBotInstructions: string | null;
}

/**
 * Контекст одного кандидата
 */
export interface CandidateContext {
  id: string;
  candidateId: string;
  candidateName: string | null;
  proposedPrice: number | null;

  proposedDeliveryDays: number | null;
  coverLetter: string | null;
  skills: string[] | null;
  rating: string | null;
  status: string;
  hrSelectionStatus: string | null;
  // Screening data
  screeningScore: number | null;
  screeningDetailedScore: number | null;
  screeningAnalysis: string | null;
  // Interview data
  interviewScore: number | null;
  interviewDetailedScore: number | null;
  interviewAnalysis: string | null;
  // Ranking data
  compositeScore: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendation: string | null;
}

/**
 * Агрегированный контекст всех кандидатов
 */
export interface CandidatesContext {
  candidates: CandidateContext[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byRecommendation: Record<string, number>;
    avgPrice: number | null;
    avgDeliveryDays: number | null;
    avgScreeningScore: number | null;
    avgInterviewScore: number | null;
  };
}

/**
 * Загружает полный контекст gig задания
 */
export async function loadGigContext(
  database: typeof db,
  gigId: string,
): Promise<GigContext | null> {
  const gigData = await database.query.gig.findFirst({
    where: eq(gig.id, gigId),
    columns: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      type: true,
      budgetMin: true,
      budgetMax: true,

      deadline: true,
      estimatedDuration: true,
      customBotInstructions: true,
    },
  });

  if (!gigData) {
    return null;
  }

  return {
    id: gigData.id,
    title: gigData.title,
    description: gigData.description,
    requirements: gigData.requirements,
    type: gigData.type,
    budgetMin: gigData.budgetMin,
    budgetMax: gigData.budgetMax,

    deadline: gigData.deadline,
    estimatedDuration: gigData.estimatedDuration,
    customBotInstructions: gigData.customBotInstructions,
  };
}

/**
 * Загружает контекст всех кандидатов для gig
 */
export async function loadCandidatesContext(
  database: typeof db,
  gigId: string,
): Promise<CandidatesContext> {
  // Загружаем все отклики с screening и interview данными
  const responses = await database.query.response.findMany({
    where: and(
      eq(responseTable.entityType, "gig"),
      eq(responseTable.entityId, gigId),
    ),
    columns: {
      id: true,
      candidateId: true,
      candidateName: true,
      proposedPrice: true,

      proposedDeliveryDays: true,
      coverLetter: true,
      skills: true,
      rating: true,
      status: true,
      hrSelectionStatus: true,
      compositeScore: true,
      strengths: true,
      weaknesses: true,
      recommendation: true,
    },
  });

  // Загружаем screening данные для всех откликов
  const responseIds = responses.map((r) => r.id);

  // Загружаем все screenings одним запросом
  const screenings: Array<{
    responseId: string;
    score: number;
    detailedScore: number;
    analysis: string | null;
  }> = [];

  if (responseIds.length > 0) {
    for (const responseId of responseIds) {
      const screening = await database.query.responseScreening.findFirst({
        where: eq(responseScreening.responseId, responseId),
        columns: {
          responseId: true,
          score: true,
          detailedScore: true,
          analysis: true,
        },
      });
      if (screening) {
        screenings.push(screening);
      }
    }
  }

  // Создаем map для быстрого доступа к screening данным
  const screeningMap = new Map(screenings.map((s) => [s.responseId, s]));

  // Загружаем interview данные для всех откликов
  const interviews: Array<{
    responseId: string | null;
    score: number;
    rating: number | null;
    analysis: string | null;
  }> = [];

  if (responseIds.length > 0) {
    for (const responseId of responseIds) {
      const interview = await database.query.interviewScoring.findFirst({
        where: eq(interviewScoring.responseId, responseId),
        columns: {
          responseId: true,
          score: true,
          rating: true,
          analysis: true,
        },
      });
      if (interview) {
        interviews.push(interview);
      }
    }
  }

  // Создаем map для быстрого доступа к interview данным
  const interviewMap = new Map(
    interviews
      .filter((i) => i.responseId !== null)
      .map((i) => [i.responseId as string, i]),
  );

  // Формируем контекст кандидатов
  const candidates: CandidateContext[] = responses.map((response) => {
    const screening = screeningMap.get(response.id);
    const interview = interviewMap.get(response.id);

    return {
      id: response.id,
      candidateId: response.candidateId,
      candidateName: response.candidateName,
      proposedPrice: response.proposedPrice,

      proposedDeliveryDays: response.proposedDeliveryDays,
      coverLetter: response.coverLetter,
      skills: response.skills,
      rating: response.rating,
      status: response.status,
      hrSelectionStatus: response.hrSelectionStatus,
      // Screening data
      screeningScore: screening?.score ?? null,
      screeningDetailedScore: screening?.detailedScore ?? null,
      screeningAnalysis: screening?.analysis ?? null,
      // Interview data
      interviewScore: interview
        ? (interview.rating ?? Math.round(interview.score / 20))
        : null,
      interviewDetailedScore: interview?.score ?? null,
      interviewAnalysis: interview?.analysis ?? null,
      // Ranking data
      compositeScore: response.compositeScore,
      strengths: response.strengths,
      weaknesses: response.weaknesses,
      recommendation: response.recommendation,
    };
  });

  // Рассчитываем статистику
  const stats = calculateCandidatesStats(candidates);

  return {
    candidates,
    stats,
  };
}

/**
 * Рассчитывает статистику по кандидатам
 */
function calculateCandidatesStats(
  candidates: CandidateContext[],
): CandidatesContext["stats"] {
  const total = candidates.length;

  // Подсчет по статусам
  const byStatus: Record<string, number> = {};
  for (const candidate of candidates) {
    byStatus[candidate.status] = (byStatus[candidate.status] || 0) + 1;
  }

  // Подсчет по рекомендациям
  const byRecommendation: Record<string, number> = {};
  for (const candidate of candidates) {
    if (candidate.recommendation) {
      byRecommendation[candidate.recommendation] =
        (byRecommendation[candidate.recommendation] || 0) + 1;
    }
  }

  // Средняя цена
  const pricesInRub = candidates
    .filter((c) => c.proposedPrice !== null)
    .map((c) => c.proposedPrice as number);
  const avgPrice =
    pricesInRub.length > 0
      ? Math.round(pricesInRub.reduce((a, b) => a + b, 0) / pricesInRub.length)
      : null;

  // Средние сроки
  const deliveryDays = candidates
    .filter((c) => c.proposedDeliveryDays !== null)
    .map((c) => c.proposedDeliveryDays as number);
  const avgDeliveryDays =
    deliveryDays.length > 0
      ? Math.round(
          deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length,
        )
      : null;

  // Средний screening score
  const screeningScores = candidates
    .filter((c) => c.screeningDetailedScore !== null)
    .map((c) => c.screeningDetailedScore as number);
  const avgScreeningScore =
    screeningScores.length > 0
      ? Math.round(
          screeningScores.reduce((a, b) => a + b, 0) / screeningScores.length,
        )
      : null;

  // Средний interview score
  const interviewScores = candidates
    .filter((c) => c.interviewDetailedScore !== null)
    .map((c) => c.interviewDetailedScore as number);
  const avgInterviewScore =
    interviewScores.length > 0
      ? Math.round(
          interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length,
        )
      : null;

  return {
    total,
    byStatus,
    byRecommendation,
    avgPrice,
    avgDeliveryDays,
    avgScreeningScore,
    avgInterviewScore,
  };
}
