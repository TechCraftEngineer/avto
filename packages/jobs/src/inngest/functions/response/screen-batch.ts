import { inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "~/services/response";
import { inngest } from "../../client";

/**
 * Inngest функция для batch оценки выбранных откликов
 */
export const screenResponsesBatchFunction = inngest.createFunction(
  {
    id: "screen-responses-batch",
    name: "Screen Responses Batch",
    batchEvents: {
      maxSize: 4,
      timeout: "10s",
    },
  },
  { event: "response/screen.batch" },
  async ({ events, step }) => {
    console.log(`🚀 Запуск batch оценки для ${events.length} событий`);

    // Собираем все responseIds из всех событий
    const allResponseIds = events.flatMap((evt) => evt.data.responseIds);

    console.log(`📋 Всего откликов для оценки: ${allResponseIds.length}`);

    // Получаем отклики
    const responses = await step.run("fetch-responses", async () => {
      const results = await db.query.response.findMany({
        where: inArray(response.id, allResponseIds),
        columns: {
          id: true,
        },
      });

      console.log(`✅ Найдено откликов в БД: ${results.length}`);
      return results;
    });

    if (responses.length === 0) {
      console.log("ℹ️ Нет откликов для оценки");
      return {
        success: true,
        total: 0,
        processed: 0,
        failed: 0,
      };
    }

    // Обрабатываем каждый отклик
    const results = await Promise.allSettled(
      responses.map(async (responseItem) => {
        return await step.run(
          `screen-response-${responseItem.id}`,
          async () => {
            try {
              console.log(`🎯 Скрининг отклика: ${responseItem.id}`);

              const resultWrapper = await screenResponse(responseItem.id);
              const result = unwrap(resultWrapper);

              console.log(`✅ Скрининг завершен: ${responseItem.id}`, {
                score: result.score,
              });

              return {
                responseId: responseItem.id,
                success: true,
                score: result.score,
              };
            } catch (error) {
              console.error(
                `❌ Ошибка скрининга для ${responseItem.id}:`,
                error,
              );
              return {
                responseId: responseItem.id,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          },
        );
      }),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `✅ Завершено: успешно ${successful}, ошибок ${failed} из ${responses.length}`,
    );

    return {
      success: true,
      total: responses.length,
      processed: successful,
      failed,
    };
  },
);
