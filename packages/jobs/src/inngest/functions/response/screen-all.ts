import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "~/services/response";
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

    // Обрабатываем каждый отклик
    const results = await Promise.allSettled(
      responses.map(async (resp) => {
        return await step.run(`screen-response-${resp.id}`, async () => {
          try {
            console.log(`🎯 Скрининг отклика: ${resp.id}`);

            const resultWrapper = await screenResponse(resp.id);
            const result = unwrap(resultWrapper);

            console.log(`✅ Скрининг завершен: ${resp.id}`, {
              score: result.overallScore,
            });

            return {
              responseId: resp.id,
              vacancyId: resp.entityId,
              success: true,
              score: result.overallScore,
            };
          } catch (error) {
            console.error(`❌ Ошибка скрининга для ${resp.id}:`, error);
            return {
              responseId: resp.id,
              vacancyId: resp.entityId,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        });
      }),
    );

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
