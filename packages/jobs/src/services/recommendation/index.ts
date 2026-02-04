/**
 * Сервис генерации рекомендаций по кандидатам
 */

import {
  buildCandidateRecommendationPrompt,
  type CandidateDataForRecommendation,
  type CandidateRecommendation,
  CandidateRecommendationSchema,
  type EntityDataForRecommendation,
  type ScreeningDataForRecommendation,
} from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { sanitizeAiText, sanitizeAiTextArray } from "@qbs-autonaim/lib";

import type { RecommendationSaveData } from "../../types/recommendation";
import { createLogger, err, ok, type Result } from "../base";

const logger = createLogger("RecommendationService");

/**
 * Подготавливает промпт для генерации рекомендации
 */
export function prepareRecommendationPrompt(
  screening: ScreeningDataForRecommendation,
  candidate: CandidateDataForRecommendation,
  entity: EntityDataForRecommendation,
): string {
  return buildCandidateRecommendationPrompt(screening, candidate, entity);
}

/**
 * Парсит ответ AI в структурированный результат
 */
export function parseRecommendationResult(
  aiResponse: string | object,
): Result<CandidateRecommendation> {
  try {
    const data =
      typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;

    const parsed = CandidateRecommendationSchema.parse(data);
    return ok(parsed);
  } catch (error) {
    logger.error("Failed to parse recommendation response", { error });
    return err(
      `Failed to parse recommendation: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Сохраняет рекомендацию в БД (обновляет response)
 */
export async function saveRecommendation(
  data: RecommendationSaveData,
): Promise<Result<void>> {
  try {
    await db
      .update(response)
      .set({
        recommendation: data.recommendation,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        candidateSummary: data.candidateSummary,
        rankingAnalysis: data.rankingAnalysis,
        rankedAt: new Date(),
      })
      .where(eq(response.id, data.responseId));

    logger.info(`Recommendation saved for response ${data.responseId}`);
    return ok(undefined);
  } catch (error) {
    logger.error("Failed to save recommendation", {
      error,
      responseId: data.responseId,
    });
    return err(
      `Failed to save recommendation: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Получает данные отклика для генерации рекомендации
 * Включает данные интервью, если оно было пройдено
 */
export async function getResponseDataForRecommendation(
  responseId: string,
): Promise<
  Result<{
    response: typeof response.$inferSelect;
    screening: ScreeningDataForRecommendation;
    candidate: CandidateDataForRecommendation;
    interview?: {
      score: number;
      rating: number;
      analysis: string;
      botUsageDetected: boolean;
    };
  }>
> {
  try {
    const responseData = await db.query.response.findFirst({
      where: eq(response.id, responseId),
      with: {
        interviewSession: {
          with: {
            scoring: true,
          },
        },
      },
    });

    if (!responseData) {
      return err(`Response ${responseId} not found`);
    }

    const screening: ScreeningDataForRecommendation = {
      score: Math.round((responseData.compositeScore ?? 0) / 20), // 0-100 -> 0-5
      detailedScore: responseData.compositeScore ?? 0,
      analysis: responseData.rankingAnalysis ?? "",
      matchPercentage: responseData.skillsMatchScore ?? undefined,
      strengths: responseData.strengths ?? undefined,
      weaknesses: responseData.weaknesses ?? undefined,
      summary: responseData.candidateSummary ?? undefined,
    };

    const candidate: CandidateDataForRecommendation = {
      name: responseData.candidateName,
      experience: responseData.experience,
      skills: responseData.skills,
      coverLetter: responseData.coverLetter,
      salaryExpectations: responseData.salaryExpectationsAmount,
      proposedPrice: responseData.proposedPrice,
      proposedDeliveryDays: responseData.proposedDeliveryDays,
    };

    // Добавляем данные интервью, если оно было пройдено
    let interview:
      | {
          score: number;
          rating: number;
          analysis: string;
          botUsageDetected: boolean;
        }
      | undefined;

    if (responseData.interviewSession?.scoring) {
      const scoring = responseData.interviewSession.scoring;
      interview = {
        score: scoring.score,
        rating: scoring.rating,
        analysis: scoring.analysis,
        botUsageDetected: scoring.botUsageDetected,
      };
    }

    return ok({ response: responseData, screening, candidate, interview });
  } catch (error) {
    logger.error("Failed to get response data", { error, responseId });
    return err(
      `Failed to get response data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Конвертирует CandidateRecommendation в RecommendationSaveData
 * Применяет санитизацию ко всем AI-сгенерированным полям
 */
export function toSaveData(
  responseId: string,
  recommendation: CandidateRecommendation,
): RecommendationSaveData {
  // Санитизируем массивы строк для rankingAnalysis
  const sanitizedActionSuggestions = sanitizeAiTextArray(
    recommendation.actionSuggestions,
    1000,
  );
  const sanitizedRiskFactors = sanitizeAiTextArray(
    recommendation.riskFactors ?? [],
    1000,
  );
  const sanitizedInterviewQuestions = sanitizeAiTextArray(
    recommendation.interviewQuestions ?? [],
    1000,
  );

  // Собираем rankingAnalysis из санитизированных элементов
  const rankingAnalysisParts = [
    ...sanitizedActionSuggestions.map((a) => `Действие: ${a}`),
    ...sanitizedRiskFactors.map((r) => `Риск: ${r}`),
    ...sanitizedInterviewQuestions.map((q) => `Вопрос: ${q}`),
  ];

  return {
    responseId,
    recommendation: recommendation.recommendation,
    strengths: sanitizeAiTextArray(recommendation.strengths, 1000),
    weaknesses: sanitizeAiTextArray(recommendation.weaknesses, 1000),
    candidateSummary: sanitizeAiText(recommendation.candidateSummary, 3000),
    rankingAnalysis: rankingAnalysisParts.join("\n"),
  };
}

// Re-export types and utilities
export type {
  RecommendationEntityType,
  RecommendationGenerationResult,
  RecommendationInput,
  RecommendationSaveData,
} from "../../types/recommendation";
