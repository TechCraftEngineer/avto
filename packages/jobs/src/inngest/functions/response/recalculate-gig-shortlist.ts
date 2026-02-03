import { GigShortlistGenerator } from "@qbs-autonaim/shared/server";
import { inngest } from "../../client";

/**
 * Inngest function for recalculating gig shortlist
 *
 * Validates that ranking data exists and is up-to-date for shortlist generation
 */
export const recalculateGigShortlistFunction = inngest.createFunction(
  {
    id: "recalculate-gig-shortlist",
    name: "Recalculate Gig Shortlist",
    retries: 3,
  },
  { event: "gig/shortlist.recalculate" },
  async ({ event, step }) => {
    const { gigId, workspaceId, triggeredBy } = event.data;

    const result = await step.run("validate-shortlist-data", async () => {
      console.log("🎯 Валидация данных для шортлиста", {
        gigId,
        workspaceId,
        triggeredBy,
      });

      try {
        // === ДИАГНОСТИКА: Проверяем наличие откликов ===
        const { db } = await import("@qbs-autonaim/db/client");
        const { response } = await import("@qbs-autonaim/db/schema");
        const { eq, and, gte, isNotNull } = await import("@qbs-autonaim/db");

        // 1. Считаем все отклики для этого gig
        const totalResponses = await db.$count(
          response,
          and(eq(response.entityType, "gig"), eq(response.entityId, gigId)),
        );

        console.log("📊 Статистика откликов для gig", {
          gigId,
          totalResponses,
        });

        // 2. Считаем отклики с compositeScore >= 70 и не NULL
        const scoredResponses = await db.$count(
          response,
          and(
            eq(response.entityType, "gig"),
            eq(response.entityId, gigId),
            gte(response.compositeScore, 70),
            isNotNull(response.compositeScore),
          ),
        );

        console.log("📊 Отклики с compositeScore >= 70", {
          gigId,
          scoredResponses,
        });

        // 3. Получаем распределение рекомендаций
        const recommendationStats = await db.query.response.findMany({
          where: and(
            eq(response.entityType, "gig"),
            eq(response.entityId, gigId),
            isNotNull(response.compositeScore),
          ),
          columns: {
            recommendation: true,
            compositeScore: true,
          },
        });

        const recStats = recommendationStats.reduce(
          (acc, r) => {
            const rec = r.recommendation || "NULL";
            acc[rec] = (acc[rec] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        console.log("📊 Распределение рекомендаций", {
          gigId,
          recommendationStats: recStats,
        });

        // 4. Получаем первые 5 откликов для детального анализа
        const sampleResponses = await db.query.response.findMany({
          where: and(
            eq(response.entityType, "gig"),
            eq(response.entityId, gigId),
          ),
          columns: {
            id: true,
            compositeScore: true,
            recommendation: true,
            status: true,
            createdAt: true,
          },
          limit: 5,
        });

        console.log("📋 Примеры откликов", {
          gigId,
          sampleResponses: sampleResponses.map((r) => ({
            id: r.id,
            compositeScore: r.compositeScore,
            recommendation: r.recommendation,
            status: r.status,
            createdAt: r.createdAt,
          })),
        });

        // Создаем генератор шортлиста
        const generator = new GigShortlistGenerator();

        // Генерируем шортлист с дефолтными настройками для валидации
        const shortlist = await generator.generateShortlist(gigId, {
          minScore: 70,
          maxCandidates: 8,
          includeOnlyHighlyRecommended: false,
          prioritizeBudgetFit: false,
        });

        console.log("📋 Шортлист валидирован", {
          gigId,
          candidatesCount: shortlist.candidates.length,
          totalCandidates: shortlist.totalCandidates,
          generatedAt: shortlist.generatedAt,
          options: shortlist.options,
        });

        // Дополнительная диагностика
        if (shortlist.candidates.length === 0 && totalResponses > 0) {
          console.warn("⚠️  Шортлист пустой несмотря на наличие откликов", {
            gigId,
            totalResponses,
            scoredResponses,
            recommendationStats: recStats,
          });
        }

        return {
          success: true,
          gigId,
          workspaceId,
          candidatesCount: shortlist.candidates.length,
          totalCandidates: shortlist.totalCandidates,
          generatedAt: shortlist.generatedAt,
          debugInfo: {
            totalResponses,
            scoredResponses,
            recommendationStats: recStats,
            sampleResponsesCount: sampleResponses.length,
          },
        };
      } catch (error) {
        console.error("❌ Ошибка валидации шортлиста", {
          gigId,
          workspaceId,
          error,
        });
        throw error;
      }
    });

    return result;
  },
);
