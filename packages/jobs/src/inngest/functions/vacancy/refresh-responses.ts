import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { refreshVacancyResponses } from "@qbs-autonaim/jobs-parsers";
import {
  refreshVacancyResponsesChannel,
  vacancyStatsChannel,
} from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для обновления откликов конкретной вакансии
 * Парсит только отклики указанной вакансии через Puppeteer в headless режиме
 */
export const refreshVacancyResponsesFunction = inngest.createFunction(
  {
    id: "refresh-vacancy-responses",
    name: "Refresh Vacancy Responses",
    retries: 1,
    concurrency: 1,
  },
  { event: "vacancy/responses.refresh" },
  async ({ event, step, publish }) => {
    const { vacancyId } = event.data;

    await publish(
      refreshVacancyResponsesChannel(vacancyId).progress({
        vacancyId,
        status: "started",
        message: "Начинаем обработку откликов…",
      }),
    );

    const result = await step.run("parse-vacancy-responses", async () => {
      console.log(`🚀 Запуск обновления откликов для вакансии ${vacancyId}`);

      const vacancyData = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, vacancyId),
      });

      if (!vacancyData) {
        await publish(
          refreshVacancyResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "error",
            message: `Вакансия ${vacancyId} не найдена`,
          }),
        );
        throw new Error(`Вакансия ${vacancyId} не найдена`);
      }

      try {
        await publish(
          refreshVacancyResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "processing",
            message: "Получаем отклики с HeadHunter",
          }),
        );

        const { newCount, totalResponses } = await refreshVacancyResponses(
          vacancyId,
          vacancyData.workspaceId,
          async (progressData) => {
            // Публикуем прогресс в realtime канал
            await publish(
              refreshVacancyResponsesChannel(vacancyId).progress({
                vacancyId,
                status: "processing",
                message: progressData.message,
                currentPage: progressData.currentPage,
                totalSaved: progressData.totalSaved,
                totalSkipped: progressData.totalSkipped,
              }),
            );
          },
        );

        await publish(
          refreshVacancyResponsesChannel(vacancyId).result({
            vacancyId,
            success: true,
            newCount,
            totalResponses,
          }),
        );

        // Публикуем обновление статистики вакансии
        await publish(
          vacancyStatsChannel(vacancyId)["responses-updated"]({
            vacancyId,
            newResponsesCount: newCount,
            totalResponsesCount: totalResponses,
            updatedAt: new Date().toISOString(),
          }),
        );

        console.log(`✅ Отклики для вакансии ${vacancyId} обновлены успешно`);

        return { success: true, vacancyId, newCount, totalResponses };
      } catch (error) {
        console.error(
          `❌ Ошибка при обновлении откликов вакансии ${vacancyId}:`,
          error,
        );
        await publish(
          refreshVacancyResponsesChannel(vacancyId).result({
            vacancyId,
            success: false,
            newCount: 0,
            totalResponses: 0,
            error:
              error instanceof Error ? error.message : "Неизвестная ошибка",
          }),
        );
        throw error;
      }
    });

    // Запускаем сбор chat_id после получения откликов
    await step.run("trigger-chat-ids-collection", async () => {
      console.log(`🔄 Запускаем сбор chat_id для вакансии ${vacancyId}`);
      await inngest.send({
        name: "vacancy/chat-ids.collect",
        data: { vacancyId },
      });
      console.log(
        `✅ Событие сбора chat_id отправлено для вакансии ${vacancyId}`,
      );
    });

    // Запускаем оценку новых откликов
    await step.run("trigger-screening", async () => {
      console.log(
        `🎯 Запускаем оценку новых откликов для вакансии ${vacancyId}`,
      );
      await inngest.send({
        name: "response/screen.new",
        data: { vacancyId },
      });
      console.log(
        `✅ Событие оценки откликов отправлено для вакансии ${vacancyId}`,
      );
    });

    return result;
  },
);
