import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { screenNewResponsesForVacancy } from "../../../services/screen-new-responses";
import {
  screenNewResponsesChannel,
  workspaceNotificationsChannel,
} from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для оценки только новых откликов (без скрининга)
 * Обрабатывает одну вакансию за раз
 */
export const screenNewResponsesFunction = inngest.createFunction(
  {
    id: "screen-new-responses",
    name: "Screen New Responses",
  },
  { event: "response/screen.new" },
  async ({ event, step, publish }) => {
    const { vacancyId } = event.data;

    console.log(`🚀 Запуск оценки новых откликов для вакансии: ${vacancyId}`);

    await publish(
      screenNewResponsesChannel(vacancyId).progress({
        vacancyId,
        status: "started",
        message: "Начинаем поиск новых откликов...",
      }),
    );

    const result = await step.run("screen-new-responses", async () => {
      const { processed, failed, total } =
        await screenNewResponsesForVacancy(vacancyId, {
          onProgress: async (progress) => {
            await publish(
              screenNewResponsesChannel(vacancyId).progress({
                vacancyId,
                status: "processing",
                message: `Оценено откликов: ${progress.processed + progress.failed} из ${progress.total}`,
                total: progress.total,
                processed: progress.processed,
                failed: progress.failed,
              }),
            );
          },
        });

      return { processed, failed, total };
    });

    if (result.total === 0) {
      await publish(
        screenNewResponsesChannel(vacancyId).result({
          vacancyId,
          success: true,
          total: 0,
          processed: 0,
          failed: 0,
        }),
      );
      return { success: true, total: 0, processed: 0, failed: 0 };
    }

    await publish(
      screenNewResponsesChannel(vacancyId).result({
        vacancyId,
        success: true,
        total: result.total,
        processed: result.processed,
        failed: result.failed,
      }),
    );

    if (result.processed > 0) {
      const vacancyData = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, vacancyId),
        columns: { workspaceId: true },
      });

      if (vacancyData?.workspaceId) {
        await publish(
          workspaceNotificationsChannel(vacancyData.workspaceId)[
            "task-completed"
          ]({
            workspaceId: vacancyData.workspaceId,
            taskType: "screening",
            taskId: vacancyId,
            success: true,
            message: `Оценено ${result.processed} новых откликов`,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }

    return {
      success: true,
      total: result.total,
      processed: result.processed,
      failed: result.failed,
    };
  },
);
