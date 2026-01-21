/**
 * RankingOrchestrator - координирует работу всех агентов ранжирования
 */

import { z } from "zod";
import type { AgentConfig } from "../../core/base-agent";
import {
  CandidateEvaluatorAgent,
  type CandidateEvaluatorInput,
  type CandidateEvaluatorOutput,
} from "./candidate-evaluator-agent";
import {
  type CandidateForComparison,
  ComparisonAgent,
  type ComparisonAgentInput,
  type ComparisonAgentOutput,
} from "./comparison-agent";
import {
  RecommendationAgent,
  type RecommendationAgentInput,
  type RecommendationAgentOutput,
  type RecommendationStatus,
} from "./recommendation-agent";
import { SummaryAgent, type SummaryAgentInput } from "./summary-agent";

/**
 * Входные данные одного кандидата для ранжирования
 */
export const candidateInputSchema = z.object({
  // Основные данные кандидата
  id: z.string(),
  candidateName: z.string().nullable().optional(),
  proposedPrice: z.number().int().nullable().optional(),

  proposedDeliveryDays: z.number().int().nullable().optional(),
  coverLetter: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  portfolioLinks: z.array(z.string()).nullable().optional(),
  rating: z.string().nullable().optional(),

  // Существующие оценки
  screeningScore: z.number().int().min(0).max(100).nullable().optional(),
  interviewScore: z.number().int().min(0).max(100).nullable().optional(),

  // Статус отбора (унифицированный)
  hrSelectionStatus: z
    .enum([
      "INVITE",
      "RECOMMENDED",
      "NOT_RECOMMENDED",
      "REJECTED",
      "SELECTED",
      "OFFER",
      "SECURITY_PASSED",
      "CONTRACT_SENT",
      "IN_PROGRESS",
      "ONBOARDING",
      "DONE",
    ])
    .nullable()
    .optional(),

  // Дата создания для tiebreaker
  createdAt: z.date(),
});

export type CandidateInput = z.infer<typeof candidateInputSchema>;

/**
 * Требования задания
 */
export const gigRequirementsSchema = z.object({
  title: z.string(),
  summary: z.string().optional(),
  required_skills: z.array(z.string()),
  nice_to_have_skills: z.array(z.string()).optional().default([]),
  tech_stack: z.array(z.string()).optional().default([]),
  experience_level: z.string().optional(),
});

export type GigRequirements = z.infer<typeof gigRequirementsSchema>;

/**
 * Бюджет и сроки задания
 */
export const gigBudgetSchema = z.object({
  budgetMin: z.number().int().nullable().optional(),
  budgetMax: z.number().int().nullable().optional(),

  deadline: z.date().nullable().optional(),
});

export type GigBudget = z.infer<typeof gigBudgetSchema>;

/**
 * Входные данные для ранжирования
 */
export const rankingInputSchema = z.object({
  candidates: z.array(candidateInputSchema).min(1),
  gigRequirements: gigRequirementsSchema,
  gigBudget: gigBudgetSchema,
});

export type RankingInput = z.infer<typeof rankingInputSchema>;

/**
 * Ранжированный кандидат с полными данными
 */
export interface RankedCandidate {
  // Исходные данные кандидата
  candidate: CandidateInput;

  // Оценки от CandidateEvaluatorAgent
  scores: {
    priceScore: number | null;
    deliveryScore: number | null;
    skillsMatchScore: number | null;
    experienceScore: number | null;
    compositeScore: number;
  };

  // Результаты сравнения от ComparisonAgent
  comparison: {
    strengths: string[];
    weaknesses: string[];
    comparative_analysis: string;
  };

  // Рекомендация от RecommendationAgent
  recommendation: {
    status: RecommendationStatus;
    ranking_analysis: string;
    actionable_insights: string[];
  };

  // Краткое резюме от SummaryAgent
  candidateSummary: string;

  // Позиция в рейтинге (1 = лучший)
  rankingPosition: number;
}

/**
 * Результат ранжирования
 */
export interface RankingResult {
  candidates: RankedCandidate[];
  totalCount: number;
  rankedAt: Date;
  categoryLeaders: {
    best_price?: string;
    fastest_delivery?: string;
    strongest_skills?: string;
    most_experienced?: string;
    highest_screening?: string;
    best_interview?: string;
    highest_composite?: string;
  };
}

/**
 * Оркестратор для координации всех агентов ранжирования
 */
export class RankingOrchestrator {
  private evaluatorAgent: CandidateEvaluatorAgent;
  private comparisonAgent: ComparisonAgent;
  private recommendationAgent: RecommendationAgent;
  private summaryAgent: SummaryAgent;

  constructor(config: AgentConfig) {
    this.evaluatorAgent = new CandidateEvaluatorAgent(config);
    this.comparisonAgent = new ComparisonAgent(config);
    this.recommendationAgent = new RecommendationAgent(config);
    this.summaryAgent = new SummaryAgent(config);
  }

  /**
   * Ранжирует всех кандидатов для задания
   */
  async rankCandidates(input: RankingInput): Promise<RankingResult> {
    // Валидация входных данных
    const validatedInput = rankingInputSchema.parse(input);

    // Фильтруем rejected кандидатов (Requirement 8.5)
    const activeCandidates = validatedInput.candidates.filter(
      (c) => c.hrSelectionStatus !== "REJECTED",
    );

    // Edge case: нет активных кандидатов
    if (activeCandidates.length === 0) {
      return {
        candidates: [],
        totalCount: 0,
        rankedAt: new Date(),
        categoryLeaders: {},
      };
    }

    // Шаг 1: Оценка каждого кандидата через CandidateEvaluatorAgent
    const evaluatedCandidates = await this.evaluateCandidates(
      activeCandidates,
      validatedInput.gigRequirements,
      validatedInput.gigBudget,
    );

    // Edge case: один кандидат - пропускаем сравнение (Requirement 8.1)
    let comparisonResults: ComparisonAgentOutput;
    if (evaluatedCandidates.length === 1) {
      const singleCandidate = evaluatedCandidates[0];
      if (!singleCandidate) {
        throw new Error("Expected single candidate but found none");
      }
      // Для одного кандидата создаем пустое сравнение
      comparisonResults = {
        comparisons: [
          {
            candidateId: singleCandidate.candidate.id,
            strengths: [],
            weaknesses: [],
            comparative_analysis:
              "Единственный кандидат в пуле. Оценка проводится по абсолютным критериям без сравнения.",
          },
        ],
        category_leaders: {
          highest_composite: singleCandidate.candidate.id,
        },
      };
    } else {
      // Шаг 2: Сравнение всех кандидатов через ComparisonAgent
      comparisonResults = await this.compareCandidates(
        evaluatedCandidates,
        validatedInput.gigRequirements,
        validatedInput.gigBudget,
      );
    }

    // Шаг 3: Формирование рекомендаций через RecommendationAgent
    const rankedCandidates = await this.generateRecommendations(
      evaluatedCandidates,
      comparisonResults,
      validatedInput.gigRequirements,
      validatedInput.gigBudget,
    );

    // Шаг 4: Сортировка по composite_score и присвоение ranking_position
    const sortedCandidates = this.sortAndAssignPositions(rankedCandidates);

    // Шаг 5: Генерация кратких резюме через AI
    const candidatesWithSummaries =
      await this.generateSummaries(sortedCandidates);

    return {
      candidates: candidatesWithSummaries,
      totalCount: candidatesWithSummaries.length,
      rankedAt: new Date(),
      categoryLeaders: comparisonResults.category_leaders,
    };
  }

  /**
   * Шаг 1: Оценка каждого кандидата
   */
  private async evaluateCandidates(
    candidates: CandidateInput[],
    gigRequirements: GigRequirements,
    gigBudget: GigBudget,
  ): Promise<
    Array<{
      candidate: CandidateInput;
      evaluation: CandidateEvaluatorOutput;
    }>
  > {
    // Собираем рыночный контекст для сравнения
    const allPrices = candidates
      .map((c) => c.proposedPrice)
      .filter((p): p is number => p !== null && p !== undefined);

    const allDeliveryDays = candidates
      .map((c) => c.proposedDeliveryDays)
      .filter((d): d is number => d !== null && d !== undefined);

    const marketContext = {
      allPrices,
      allDeliveryDays,
    };

    // Оцениваем каждого кандидата
    const evaluations = await Promise.all(
      candidates.map(async (candidate) => {
        const evaluatorInput: CandidateEvaluatorInput = {
          candidate: {
            id: candidate.id,
            candidateName: candidate.candidateName,
            proposedPrice: candidate.proposedPrice,

            proposedDeliveryDays: candidate.proposedDeliveryDays,
            coverLetter: candidate.coverLetter,
            experience: candidate.experience,
            skills: candidate.skills,
            portfolioLinks: candidate.portfolioLinks,
            rating: candidate.rating,
          },
          gigRequirements,
          gigBudget,
          existingScores: {
            screeningScore: candidate.screeningScore,
            interviewScore: candidate.interviewScore,
          },
          marketContext,
        };

        const result = await this.evaluatorAgent.execute(
          evaluatorInput,
          undefined,
        );

        if (!result.success || !result.data) {
          throw new Error(
            `Failed to evaluate candidate ${candidate.id}: ${result.error}`,
          );
        }

        return {
          candidate,
          evaluation: result.data,
        };
      }),
    );

    return evaluations;
  }

  /**
   * Шаг 2: Сравнение всех кандидатов
   */
  private async compareCandidates(
    evaluatedCandidates: Array<{
      candidate: CandidateInput;
      evaluation: CandidateEvaluatorOutput;
    }>,
    gigRequirements: GigRequirements,
    gigBudget: GigBudget,
  ): Promise<ComparisonAgentOutput> {
    // Подготавливаем данные для сравнения
    const candidatesForComparison: CandidateForComparison[] =
      evaluatedCandidates.map(({ candidate, evaluation }) => ({
        id: candidate.id,
        candidateName: candidate.candidateName,
        priceScore: evaluation.priceScore.score,
        deliveryScore: evaluation.deliveryScore.score,
        skillsMatchScore: evaluation.skillsMatchScore.score,
        experienceScore: evaluation.experienceScore.score,
        screeningScore: candidate.screeningScore,
        interviewScore: candidate.interviewScore,
        compositeScore: evaluation.compositeScore.score ?? 0,
        proposedPrice: candidate.proposedPrice,
        proposedDeliveryDays: candidate.proposedDeliveryDays,
        skills: candidate.skills,
        experience: candidate.experience,
      }));

    const comparisonInput: ComparisonAgentInput = {
      candidates: candidatesForComparison,
      gigRequirements,
      gigBudget,
    };

    const result = await this.comparisonAgent.execute(
      comparisonInput,
      undefined,
    );

    if (!result.success || !result.data) {
      throw new Error(`Failed to compare candidates: ${result.error}`);
    }

    return result.data;
  }

  /**
   * Шаг 3: Формирование рекомендаций для каждого кандидата
   */
  private async generateRecommendations(
    evaluatedCandidates: Array<{
      candidate: CandidateInput;
      evaluation: CandidateEvaluatorOutput;
    }>,
    comparisonResults: ComparisonAgentOutput,
    gigRequirements: GigRequirements,
    gigBudget: GigBudget,
  ): Promise<
    Array<{
      candidate: CandidateInput;
      evaluation: CandidateEvaluatorOutput;
      comparison: {
        strengths: string[];
        weaknesses: string[];
        comparative_analysis: string;
      };
      recommendation: RecommendationAgentOutput;
    }>
  > {
    // Вычисляем контекст конкуренции
    const compositeScores = evaluatedCandidates.map(
      (ec) => ec.evaluation.compositeScore.score ?? 0,
    );
    const averageCompositeScore =
      compositeScores.reduce((sum, score) => sum + score, 0) /
      compositeScores.length;
    const topCompositeScore = Math.max(...compositeScores);

    const competitionContext = {
      totalCandidates: evaluatedCandidates.length,
      averageCompositeScore,
      topCompositeScore,
    };

    // Генерируем рекомендации для каждого кандидата
    const recommendations = await Promise.all(
      evaluatedCandidates.map(async ({ candidate, evaluation }) => {
        // Находим результаты сравнения для этого кандидата
        const comparison = comparisonResults.comparisons.find(
          (c) => c.candidateId === candidate.id,
        );

        if (!comparison) {
          throw new Error(`Comparison not found for candidate ${candidate.id}`);
        }

        const recommendationInput: RecommendationAgentInput = {
          candidate: {
            id: candidate.id,
            candidateName: candidate.candidateName,
            proposedPrice: candidate.proposedPrice,

            proposedDeliveryDays: candidate.proposedDeliveryDays,
            coverLetter: candidate.coverLetter,
            experience: candidate.experience,
            skills: candidate.skills,
          },
          scores: {
            priceScore: evaluation.priceScore.score,
            deliveryScore: evaluation.deliveryScore.score,
            skillsMatchScore: evaluation.skillsMatchScore.score,
            experienceScore: evaluation.experienceScore.score,
            screeningScore: candidate.screeningScore,
            interviewScore: candidate.interviewScore,
            compositeScore: evaluation.compositeScore.score ?? 0,
          },
          comparison: {
            strengths: comparison.strengths,
            weaknesses: comparison.weaknesses,
            comparative_analysis: comparison.comparative_analysis,
          },
          gigRequirements,
          gigBudget,
          competitionContext,
        };

        const result = await this.recommendationAgent.execute(
          recommendationInput,
          undefined,
        );

        if (!result.success || !result.data) {
          throw new Error(
            `Failed to generate recommendation for candidate ${candidate.id}: ${result.error}`,
          );
        }

        return {
          candidate,
          evaluation,
          comparison: {
            strengths: comparison.strengths,
            weaknesses: comparison.weaknesses,
            comparative_analysis: comparison.comparative_analysis,
          },
          recommendation: result.data,
        };
      }),
    );

    return recommendations;
  }

  /**
   * Шаг 4: Сортировка по composite_score и присвоение ranking_position
   */
  private sortAndAssignPositions(
    candidates: Array<{
      candidate: CandidateInput;
      evaluation: CandidateEvaluatorOutput;
      comparison: {
        strengths: string[];
        weaknesses: string[];
        comparative_analysis: string;
      };
      recommendation: RecommendationAgentOutput;
    }>,
  ): RankedCandidate[] {
    // Сортируем по composite_score (descending), затем по createdAt (ascending) для tiebreaker
    const sorted = [...candidates].sort((a, b) => {
      const scoreA = a.evaluation.compositeScore.score ?? 0;
      const scoreB = b.evaluation.compositeScore.score ?? 0;

      // Сначала по score (больше = лучше)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // Tiebreaker: раньше созданный = лучше (Requirement 8.3)
      return a.candidate.createdAt.getTime() - b.candidate.createdAt.getTime();
    });

    // Присваиваем позиции
    return sorted.map((item, index) => ({
      candidate: item.candidate,
      scores: {
        priceScore: item.evaluation.priceScore.score,
        deliveryScore: item.evaluation.deliveryScore.score,
        skillsMatchScore: item.evaluation.skillsMatchScore.score,
        experienceScore: item.evaluation.experienceScore.score,
        compositeScore: item.evaluation.compositeScore.score ?? 0,
      },
      comparison: item.comparison,
      recommendation: {
        status: item.recommendation.recommendation,
        ranking_analysis: item.recommendation.ranking_analysis,
        actionable_insights: item.recommendation.actionable_insights,
      },
      candidateSummary: "", // Будет заполнено в generateSummaries
      rankingPosition: index + 1, // 1-based position
    }));
  }

  /**
   * Шаг 5: Генерация кратких резюме через SummaryAgent
   */
  private async generateSummaries(
    rankedCandidates: RankedCandidate[],
  ): Promise<RankedCandidate[]> {
    const candidatesWithSummaries = await Promise.all(
      rankedCandidates.map(async (rankedCandidate) => {
        const summaryInput: SummaryAgentInput = {
          candidateName: rankedCandidate.candidate.candidateName,
          compositeScore: rankedCandidate.scores.compositeScore,
          recommendation: rankedCandidate.recommendation.status,
          rankingAnalysis: rankedCandidate.recommendation.ranking_analysis,
          strengths: rankedCandidate.comparison.strengths,
          weaknesses: rankedCandidate.comparison.weaknesses,
        };

        const result = await this.summaryAgent.execute(summaryInput, undefined);

        if (!result.success || !result.data) {
          throw new Error(
            `Failed to generate summary for candidate ${rankedCandidate.candidate.id}: ${result.error}`,
          );
        }

        return {
          ...rankedCandidate,
          candidateSummary: result.data.summary,
        };
      }),
    );

    return candidatesWithSummaries;
  }
}
