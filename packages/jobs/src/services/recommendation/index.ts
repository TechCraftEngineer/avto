/**
 * Сервис генерации рекомендаций по кандидатам
 */

import {
  buildCandidateRecommendationPrompt,
  CandidateRecommendationSchema,
  type CandidateDataForRecommendation,
  type CandidateRecommendation,
  type EntityDataForRecommendation,
  type ScreeningDataForRecommendation,
} from "@qbs-autonaim/ai";
import { db } from "@qbs-autonaim/db";
import { response } from "@qbs-autonaim/db/schema";
import { eq } from "drizzle-orm";

import type {
  RecommendationEntityType,
  RecommendationGenerationResult,
  RecommendationInput,
  RecommendationSaveData,
} from "../../types/recommendation";
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
 */
export async function getResponseDataForRecommendation(
  responseId: string,
): Promise<
  Result<{
    response: typeof response.$inferSelect;
    screening: ScreeningDataForRecommendation;
    candidate: CandidateDataForRecommendation;
  }>
> {
  try {
    const responseData = await db.query.response.findFirst({
      where: eq(response.id, responseId),
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

    return ok({ response: responseData, screening, candidate });
  } catch (error) {
    logger.error("Failed to get response data", { error, responseId });
    return err(
      `Failed to get response data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Конвертирует CandidateRecommendation в RecommendationSaveData
 */
export function toSaveData(
  responseId: string,
  recommendation: CandidateRecommendation,
): RecommendationSaveData {
  return {
    responseId,
    recommendation: recommendation.recommendation,
    strengths: recommendation.strengths,
    weaknesses: recommendation.weaknesses,
    candidateSummary: recommendation.candidateSummary,
    rankingAnalysis: [
      ...recommendation.actionSuggestions.map((a) => `Действие: ${a}`),
      ...(recommendation.riskFactors?.map((r) => `Риск: ${r}`) ?? []),
      ...(recommendation.interviewQuestions?.map((q) => `Вопрос: ${q}`) ?? []),
    ].join("\n"),
  };
}

// Re-export types and utilities
export type {
  RecommendationEntityType,
  RecommendationGenerationResult,
  RecommendationInput,
  RecommendationSaveData,
} from "../../types/recommendation";
