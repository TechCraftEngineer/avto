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
import { db } from "@qbs-autonaim/db/client";
import { z } from "zod";
import { formatExperienceText } from "../utils/experience-helpers";

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

/**
 * Тип для ранжированного кандидата с данными скрининга
 */
export type RankedCandidate = typeof response.$inferSelect & {
  screening: typeof responseScreening.$inferSelect | null;
};

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
        profileData: true,
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
    // Сначала загружаем screening и interview оценки для всех кандидатов
    const candidateIds = candidates.map((c) => c.id);

    // Загружаем screening scores
    const screenings = await db.query.responseScreening.findMany({
      where: (s, { inArray }) => inArray(s.responseId, candidateIds),
      columns: {
        responseId: true,
        overallScore: true,
      },
    });

    // Загружаем interview scores
    const interviewScores = await db.query.interviewScoring.findMany({
      where: (s, { inArray }) => inArray(s.responseId, candidateIds),
      columns: {
        responseId: true,
        score: true,
      },
    });

    // Создаём lookup maps
    const screeningMap = new Map(screenings.map((s) => [s.responseId, s.overallScore]));
    const interviewScoreMap = new Map(interviewScores.map((i) => [i.responseId, i.score]));

    const candidateInputs: CandidateInput[] = candidates.map((c) => ({
      id: c.id,
      candidateName: c.candidateName,
      proposedPrice: c.proposedPrice,
      proposedDeliveryDays: c.proposedDeliveryDays,
      coverLetter: c.coverLetter,
      experience: formatExperienceText(
        c.profileData as Record<string, unknown> | null,
      ),
      skills: c.skills as string[] | null | undefined,
      portfolioLinks: c.portfolioLinks as string[] | null | undefined,
      rating: c.rating,
      screeningScore: screeningMap.get(c.id) ?? null,
      interviewScore: interviewScoreMap.get(c.id) ?? null,
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
    candidates: RankedCandidate[];
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

    // Строим условия фильтрации для response
    const responseConditions = [
      eq(response.entityType, "gig"),
      eq(response.entityId, gigId),
    ];

    // Получаем кандидатов с screening и применяем фильтры
    const candidates = await db.query.response.findMany({
      where: and(...responseConditions),
      with: {
        screening: true,
      },
      orderBy: [desc(response.createdAt)],
      limit: filters.limit * 2, // Берем больше для фильтрации
      offset: filters.offset,
    });

    // Фильтруем по minScore и recommendation на уровне приложения
    let filteredCandidates = candidates;

    if (filters.minScore !== undefined) {
      const minScore = filters.minScore;
      filteredCandidates = filteredCandidates.filter(
        (c) => (c.screening?.overallScore ?? 0) >= minScore,
      );
    }

    if (filters.recommendation) {
      filteredCandidates = filteredCandidates.filter(
        (c) => c.screening?.recommendation === filters.recommendation,
      );
    }

    // Сортируем по overallScore и rankingPosition
    filteredCandidates.sort((a, b) => {
      const scoreA = a.screening?.overallScore ?? 0;
      const scoreB = b.screening?.overallScore ?? 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      const posA = a.screening?.rankingPosition ?? Number.MAX_SAFE_INTEGER;
      const posB = b.screening?.rankingPosition ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });

    // Применяем limit после фильтрации
    const paginatedCandidates = filteredCandidates.slice(
      0,
      filters.limit,
    ) as RankedCandidate[];

    // Получаем общее количество с учетом фильтров
    const allCandidates = await db.query.response.findMany({
      where: and(...responseConditions),
      with: {
        screening: true,
      },
    });

    let totalCount = allCandidates.length;

    if (filters.minScore !== undefined || filters.recommendation) {
      let filtered = allCandidates;

      if (filters.minScore !== undefined) {
        const minScore = filters.minScore;
        filtered = filtered.filter(
          (c) => (c.screening?.overallScore ?? 0) >= minScore,
        );
      }

      if (filters.recommendation) {
        filtered = filtered.filter(
          (c) => c.screening?.recommendation === filters.recommendation,
        );
      }

      totalCount = filtered.length;
    }

    // Получаем дату последнего ранжирования из screening
    const [latestRanked] = await db
      .select({ screenedAt: responseScreening.screenedAt })
      .from(responseScreening)
      .innerJoin(response, eq(responseScreening.responseId, response.id))
      .where(
        and(
          eq(response.entityType, "gig"),
          eq(response.entityId, gigId),
          sql`${responseScreening.screenedAt} IS NOT NULL`,
        ),
      )
      .orderBy(desc(responseScreening.screenedAt))
      .limit(1);

    return {
      candidates: paginatedCandidates,
      totalCount,
      rankedAt: latestRanked?.screenedAt ?? null,
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
        // Проверяем существование screening записи
        const existingScreening = await tx.query.responseScreening.findFirst({
          where: eq(responseScreening.responseId, rankedCandidate.candidate.id),
        });

        if (existingScreening) {
          // Обновляем существующую запись
          await tx
            .update(responseScreening)
            .set({
              overallScore: rankedCandidate.scores.compositeScore,
              priceScore: rankedCandidate.scores.priceScore,
              deliveryScore: rankedCandidate.scores.deliveryScore,
              skillsMatchScore: rankedCandidate.scores.skillsMatchScore,
              experienceScore: rankedCandidate.scores.experienceScore,
              // Анализы
              priceAnalysis: rankedCandidate.reasoning.priceScoreReasoning,
              deliveryAnalysis:
                rankedCandidate.reasoning.deliveryScoreReasoning,
              skillsAnalysis:
                rankedCandidate.reasoning.skillsMatchScoreReasoning,
              experienceAnalysis:
                rankedCandidate.reasoning.experienceScoreReasoning,
              overallAnalysis:
                rankedCandidate.reasoning.compositeScoreReasoning,
              rankingPosition: rankedCandidate.rankingPosition,
              rankingAnalysis: rankedCandidate.recommendation.ranking_analysis,
              candidateSummary: rankedCandidate.candidateSummary,
              strengths: rankedCandidate.comparison.strengths,
              weaknesses: rankedCandidate.comparison.weaknesses,
              recommendation: rankedCandidate.recommendation.status,
              screenedAt: result.rankedAt,
            })
            .where(
              eq(responseScreening.responseId, rankedCandidate.candidate.id),
            );
        } else {
          // Создаем новую запись
          await tx.insert(responseScreening).values({
            responseId: rankedCandidate.candidate.id,
            overallScore: rankedCandidate.scores.compositeScore,
            priceScore: rankedCandidate.scores.priceScore,
            deliveryScore: rankedCandidate.scores.deliveryScore,
            skillsMatchScore: rankedCandidate.scores.skillsMatchScore,
            experienceScore: rankedCandidate.scores.experienceScore,
            // Анализы
            priceAnalysis: rankedCandidate.reasoning.priceScoreReasoning,
            deliveryAnalysis: rankedCandidate.reasoning.deliveryScoreReasoning,
            skillsAnalysis: rankedCandidate.reasoning.skillsMatchScoreReasoning,
            experienceAnalysis:
              rankedCandidate.reasoning.experienceScoreReasoning,
            overallAnalysis: rankedCandidate.reasoning.compositeScoreReasoning,
            rankingPosition: rankedCandidate.rankingPosition,
            rankingAnalysis: rankedCandidate.recommendation.ranking_analysis,
            candidateSummary: rankedCandidate.candidateSummary,
            strengths: rankedCandidate.comparison.strengths,
            weaknesses: rankedCandidate.comparison.weaknesses,
            recommendation: rankedCandidate.recommendation.status,
            screenedAt: result.rankedAt,
          });
        }
      }
    });
  }
}
