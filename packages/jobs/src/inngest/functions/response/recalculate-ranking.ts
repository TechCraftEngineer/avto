import { getAIModel } from "@qbs-autonaim/lib";
import { RankingService } from "@qbs-autonaim/shared/server";
import { inngest } from "../../client";

/**
 * Inngest function for recalculating gig candidate rankings
 */
export const recalculateRankingFunction = inngest.createFunction(
  {
    id: "recalculate-gig-ranking",
    name: "Recalculate Gig Candidate Ranking",
    retries: 3,
  },
  { event: "gig/ranking.recalculate" },
  async ({ event, step }) => {
    const { gigId, workspaceId, triggeredBy } = event.data;

    const result = await step.run("recalculate-ranking", async () => {
      console.log("🎯 Пересчет рейтинга кандидатов", {
        gigId,
        workspaceId,
        triggeredBy,
      });

      try {
        // Создаем экземпляр RankingService с конфигурацией AI агентов
        const model = getAIModel();
        const rankingService = new RankingService({
          model,
        });

        // Вычисляем рейтинг
        const rankingResult = await rankingService.calculateRankings(
          gigId,
          workspaceId,
        );

        console.log("📊 Рейтинг вычислен", {
          gigId,
          candidatesCount: rankingResult.candidates.length,
          rankedAt: rankingResult.rankedAt,
        });

        // Сохраняем результаты в БД
        await rankingService.saveRankings(gigId, workspaceId, rankingResult);

        console.log("✅ Рейтинг сохранен в БД", {
          gigId,
          candidatesCount: rankingResult.candidates.length,
        });

        return {
          success: true,
          gigId,
          workspaceId,
          candidatesCount: rankingResult.candidates.length,
          rankedAt: rankingResult.rankedAt,
        };
      } catch (error) {
        console.error("❌ Ошибка пересчета рейтинга", {
          gigId,
          workspaceId,
          error,
        });
        throw error;
      }
    });

    // После успешного пересчета рейтинга автоматически пересчитываем шортлист
    await step.run("trigger-shortlist-recalculation", async () => {
      console.log("🎯 Запуск пересчета шортлиста", { gigId, workspaceId });

      // Отправляем событие для пересчета шортлиста
      await inngest.send({
        name: "gig/shortlist.recalculate",
        data: {
          gigId,
          workspaceId,
          triggeredBy: triggeredBy || "system",
        },
      });
    });

    return result;
  },
);
