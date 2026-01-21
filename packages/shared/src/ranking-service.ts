/**
 * RankingService - тонкая обертка над RankingOrchestrator для использования в API
 *
 * Координирует загрузку данных из БД, вызов AI агентов и сохранение результатов
 */

// Import ranking types and orchestrator
// These will be available after building the AI package
import type {
  AgentConfig,
  CandidateInput,
  GigBudget,
  GigRequirements,
  RankingResult,
} from "@qbs-autonaim/ai";
import { RankingOrchestrator } from "@qbs-autonaim/ai";
import { and, desc, eq, gte, sql } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { gig, response } from "@qbs-autonaim/db/schema";
import { z } from "zod";

/**
 * Фильтры для получения ранжированных кандидатов
 */
export const getRankedCandidatesFiltersSchema = z.object({
  minScore: z.number().int().min(0).max(100).optional(),
  recommendation: z
    .enum(["HIGHLY_RECOMMENDED", "RECOMMENDED", "NEUTRAL", "NOT_RECOMMENDED"])
    .optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type GetRankedCandidatesFilters = z.infer<
  typeof getRankedCandidatesFiltersSchema
>;

export class RankingServiceError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "BAD_REQUEST",
  ) {
    super(message);
    this.name = "RankingServiceError";
  }
}

/**
 * Сервис для управления ранжированием кандидатов
 */
export class RankingService {
  private orchestrator: RankingOrchestrator;

  constructor(agentConfig: AgentConfig) {
    this.orchestrator = new RankingOrchestrator(agentConfig);
  }

  /**
   * Вычисляет рейтинг для всех кандидатов задания
   *
   * @param gigId - ID задания
   * @param workspaceId - ID workspace (для проверки доступа)
   * @returns Результаты ранжирования
   */
  async calculateRankings(
    gigId: string,
    workspaceId: string,
  ): Promise<RankingResult> {
    // 1. Загружаем задание с требованиями
    const gigData = await db.query.gig.findFirst({
      where: and(eq(gig.id, gigId), eq(gig.workspaceId, workspaceId)),
      columns: {
        id: true,
        title: true,
        requirements: true,
        budgetMin: true,
        budgetMax: true,

        deadline: true,
      },
    });

    if (!gigData) {
      throw new RankingServiceError("Задание не найдено", "NOT_FOUND");
    }

    // 2. Загружаем всех кандидатов
    const candidates = await db.query.response.findMany({
      where: and(eq(response.entityType, "gig"), eq(response.entityId, gigId)),
      columns: {
        id: true,
        candidateName: true,
        proposedPrice: true,

        proposedDeliveryDays: true,
        coverLetter: true,
        experience: true,
        skills: true,
        portfolioLinks: true,
        rating: true,
        hrSelectionStatus: true,
        createdAt: true,
      },
    });

    if (candidates.length === 0) {
      throw new RankingServiceError(
        "Нет кандидатов для ранжирования",
        "BAD_REQUEST",
      );
    }

    // 3. Преобразуем в формат для оркестратора
    const candidateInputs: CandidateInput[] = candidates.map((c) => ({
      id: c.id,
      candidateName: c.candidateName,
      proposedPrice: c.proposedPrice,

      proposedDeliveryDays: c.proposedDeliveryDays,
      coverLetter: c.coverLetter,
      experience: c.experience,
      skills: c.skills as string[] | null | undefined,
      portfolioLinks: c.portfolioLinks as string[] | null | undefined,
      rating: c.rating,
      screeningScore: null, // TODO: добавить когда будет screening
      interviewScore: null, // TODO: добавить когда будет interview
      hrSelectionStatus: c.hrSelectionStatus,
      createdAt: c.createdAt,
    }));

    // 4. Подготавливаем требования задания
    const gigRequirements: GigRequirements = {
      title: gigData.title,
      summary: gigData.requirements?.summary ?? "",
      required_skills: gigData.requirements?.required_skills ?? [],
      nice_to_have_skills: gigData.requirements?.nice_to_have_skills ?? [],
      tech_stack: gigData.requirements?.tech_stack ?? [],
      experience_level: gigData.requirements?.experience_level,
    };

    // 5. Подготавливаем бюджет
    const gigBudget: GigBudget = {
      budgetMin: gigData.budgetMin,
      budgetMax: gigData.budgetMax,

      deadline: gigData.deadline,
    };

    // 6. Вызываем оркестратор
    const result = await this.orchestrator.rankCandidates({
      candidates: candidateInputs,
      gigRequirements,
      gigBudget,
    });

    return result;
  }

  /**
   * Получает уже рассчитанные ранжированные данные из БД
   *
   * @param gigId - ID задания
   * @param workspaceId - ID workspace (для проверки доступа)
   * @param filters - Фильтры для выборки
   * @returns Список ранжированных кандидатов
   */
  async getRankedCandidates(
    gigId: string,
    workspaceId: string,
    filters: GetRankedCandidatesFilters = { limit: 50, offset: 0 },
  ): Promise<{
    candidates: Array<typeof response.$inferSelect>;
    totalCount: number;
    rankedAt: Date | null;
  }> {
    // Проверяем доступ к заданию
    const gigData = await db.query.gig.findFirst({
      where: and(eq(gig.id, gigId), eq(gig.workspaceId, workspaceId)),
      columns: { id: true },
    });

    if (!gigData) {
      throw new RankingServiceError("Задание не найдено", "NOT_FOUND");
    }

    // Строим условия фильтрации
    const conditions = [
      eq(response.entityType, "gig"),
      eq(response.entityId, gigId),
    ];

    if (filters.minScore !== undefined) {
      conditions.push(gte(response.compositeScore, filters.minScore));
    }

    if (filters.recommendation) {
      conditions.push(eq(response.recommendation, filters.recommendation));
    }

    // Получаем кандидатов с пагинацией
    const candidates = await db.query.response.findMany({
      where: and(...conditions),
      orderBy: [desc(response.compositeScore), desc(response.rankingPosition)],
      limit: filters.limit,
      offset: filters.offset,
    });

    // Получаем общее количество
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(response)
      .where(and(...conditions));

    const totalCount = countResult?.count ?? 0;

    // Получаем дату последнего ранжирования
    const [latestRanked] = await db
      .select({ rankedAt: response.rankedAt })
      .from(response)
      .where(
        and(
          eq(response.entityType, "gig"),
          eq(response.entityId, gigId),
          sql`${response.rankedAt} IS NOT NULL`,
        ),
      )
      .orderBy(desc(response.rankedAt))
      .limit(1);

    return {
      candidates,
      totalCount,
      rankedAt: latestRanked?.rankedAt ?? null,
    };
  }

  /**
   * Сохраняет результаты ранжирования в БД
   *
   * @param gigId - ID задания
   * @param workspaceId - ID workspace (для проверки доступа)
   * @param result - Результаты ранжирования от оркестратора
   */
  async saveRankings(
    gigId: string,
    workspaceId: string,
    result: RankingResult,
  ): Promise<void> {
    // Проверяем доступ к заданию
    const gigData = await db.query.gig.findFirst({
      where: and(eq(gig.id, gigId), eq(gig.workspaceId, workspaceId)),
      columns: { id: true },
    });

    if (!gigData) {
      throw new RankingServiceError("Задание не найдено", "NOT_FOUND");
    }

    // Сохраняем результаты для каждого кандидата
    const candidateIds = result.candidates.map((c) => c.candidate.id);

    if (candidateIds.length === 0) {
      return;
    }

    // Используем транзакцию для атомарности
    await db.transaction(async (tx) => {
      // Обновляем каждого кандидата
      for (const rankedCandidate of result.candidates) {
        await tx
          .update(response)
          .set({
            compositeScore: rankedCandidate.scores.compositeScore,
            priceScore: rankedCandidate.scores.priceScore,
            deliveryScore: rankedCandidate.scores.deliveryScore,
            skillsMatchScore: rankedCandidate.scores.skillsMatchScore,
            experienceScore: rankedCandidate.scores.experienceScore,
            rankingPosition: rankedCandidate.rankingPosition,
            rankingAnalysis: rankedCandidate.recommendation.ranking_analysis,
            candidateSummary: rankedCandidate.candidateSummary,
            strengths: rankedCandidate.comparison.strengths,
            weaknesses: rankedCandidate.comparison.weaknesses,
            recommendation: rankedCandidate.recommendation.status,
            rankedAt: result.rankedAt,
          })
          .where(eq(response.id, rankedCandidate.candidate.id));
      }
    });
  }
}
