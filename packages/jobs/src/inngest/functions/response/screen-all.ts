import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "../../../services/response";
import { screenAllResponsesChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для оценки всех откликов вакансии
 */
export const screenAllResponsesFunction = inngest.createFunction(
  {
    id: "screen-all-responses",
    name: "Screen All Responses",
    batchEvents: {
      maxSize: 4,
      timeout: "10s",
    },
  },
  { event: "response/screen.all" },
  async ({ events, step, publish }) => {
    console.log(`🚀 Запуск оценки всех откликов для ${events.length} событий`);

    // Собираем все vacancyIds из всех событий
    const vacancyIds = events.map((evt) => evt.data.vacancyId);

    console.log(`📋 Вакансии для обработки: ${vacancyIds.join(", ")}`);

    // Отправляем уведомление о начале для каждой вакансии
    for (const vacancyId of vacancyIds) {
      await publish(
        screenAllResponsesChannel(vacancyId).progress({
          vacancyId,
          status: "started",
          message: "Начинаем поиск откликов...",
        }),
      );
    }

    // Получаем все отклики
    const responses = await step.run("fetch-all-responses", async () => {
      const allResponses = await Promise.all(
        vacancyIds.map((vacancyId) =>
          db.query.response.findMany({
            where: and(
              eq(response.entityType, "vacancy"),
              eq(response.entityId, vacancyId),
            ),
            columns: {
              id: true,
              entityId: true,
            },
          }),
        ),
      );

      const results = allResponses.flat();

      console.log(`✅ Найдено откликов: ${results.length}`);
      return results;
    });

    if (responses.length === 0) {
      console.log("ℹ️ Нет откликов для оценки");

      // Отправляем уведомление о завершении
      for (const vacancyId of vacancyIds) {
        await publish(
          screenAllResponsesChannel(vacancyId).result({
            vacancyId,
            success: true,
            total: 0,
            processed: 0,
            failed: 0,
          }),
        );
      }

      return {
        success: true,
        total: 0,
        processed: 0,
        failed: 0,
      };
    }

    // Группируем отклики по вакансиям для отчетности
    const responsesByVacancy = responses.reduce(
      (acc: Record<string, typeof responses>, r) => {
        if (!acc[r.entityId]) acc[r.entityId] = [];
        acc[r.entityId]?.push(r);
        return acc;
      },
      {} as Record<string, typeof responses>,
    );

    // Отправляем прогресс о найденных откликах
    for (const [vacancyId, vacancyResponses] of Object.entries(
      responsesByVacancy,
    )) {
      await publish(
        screenAllResponsesChannel(vacancyId).progress({
          vacancyId,
          status: "processing",
          message: `Найдено ${vacancyResponses.length} откликов. Начинаем оценку...`,
          total: vacancyResponses.length,
          processed: 0,
          failed: 0,
        }),
      );
    }

    // Обрабатываем каждый отклик с отслеживанием прогресса
    const results = await Promise.allSettled(
      responses.map(async (resp) => {
        return await step.run(`screen-response-${resp.id}`, async () => {
          try {
            console.log(`🎯 Скрининг отклика: ${resp.id}`);

            const resultWrapper = await screenResponse(resp.id);
            const result = unwrap(resultWrapper);

            console.log(`✅ Скрининг завершен: ${resp.id}`, {
              score: result.detailedScore,
            });

            return {
              responseId: resp.id,
              vacancyId: resp.entityId,
              success: true,
              processed: 1,
              failed: 0,
              score: result.detailedScore,
            };
          } catch (error) {
            console.error(`❌ Ошибка скрининга для ${resp.id}:`, error);

            return {
              responseId: resp.id,
              vacancyId: resp.entityId,
              success: false,
              processed: 1,
              failed: 1,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        });
      }),
    );

    // Агрегируем результаты после завершения всех задач
    const progressByVacancy: Record<
      string,
      { processed: number; failed: number }
    > = {};

    // Инициализируем счетчики для каждой вакансии
    for (const vacancyId of Object.keys(responsesByVacancy)) {
      progressByVacancy[vacancyId] = { processed: 0, failed: 0 };
    }

    // Собираем результаты из settled promises
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (!result) continue;

      if (result.status === "fulfilled") {
        const { vacancyId, processed, failed } = result.value;
        const vacancyProgress = progressByVacancy[vacancyId];
        if (vacancyProgress) {
          vacancyProgress.processed += processed;
          vacancyProgress.failed += failed;
        }
      } else if (result.status === "rejected") {
        // Обрабатываем rejected случаи
        // Используем индекс для определения соответствующего отклика
        const resp = responses[i];
        if (resp) {
          const vacancyProgress = progressByVacancy[resp.entityId];
          if (vacancyProgress) {
            vacancyProgress.processed += 1;
            vacancyProgress.failed += 1;
          }
        }
      }
    }

    // Отправляем прогресс для каждой вакансии после агрегации
    for (const [vacancyId, vacancyResponses] of Object.entries(
      responsesByVacancy,
    )) {
      const vacancyProgress = progressByVacancy[vacancyId];
      if (vacancyProgress) {
        console.log(
          `📊 Итоговый прогресс для ${vacancyId}: ${vacancyProgress.processed}/${vacancyResponses.length}`,
        );
        await publish(
          screenAllResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "processing",
            message: `Обработано ${vacancyProgress.processed} из ${vacancyResponses.length} откликов`,
            total: vacancyResponses.length,
            processed: vacancyProgress.processed,
            failed: vacancyProgress.failed,
          }),
        );
      }
    }

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `✅ Завершено: успешно ${successful}, ошибок ${failed} из ${responses.length}`,
    );

    // Отправляем финальные результаты для каждой вакансии
    for (const [vacancyId, vacancyResponses] of Object.entries(
      responsesByVacancy,
    )) {
      const vacancyResults = results.filter((r) => {
        if (r.status === "fulfilled") {
          return r.value.vacancyId === vacancyId;
        }
        return false;
      });

      const vacancySuccessful = vacancyResults.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const vacancyFailed = vacancyResponses.length - vacancySuccessful;

      // Отправляем финальный progress перед result
      await publish(
        screenAllResponsesChannel(vacancyId).progress({
          vacancyId,
          status: "processing",
          message: `Обработано ${vacancyResponses.length} из ${vacancyResponses.length} откликов`,
          total: vacancyResponses.length,
          processed: vacancyResponses.length,
          failed: vacancyFailed,
        }),
      );

      await publish(
        screenAllResponsesChannel(vacancyId).result({
          vacancyId,
          success: true,
          total: vacancyResponses.length,
          processed: vacancySuccessful,
          failed: vacancyFailed,
        }),
      );
    }

    return {
      success: true,
      total: responses.length,
      processed: successful,
      failed,
    };
  },
);
