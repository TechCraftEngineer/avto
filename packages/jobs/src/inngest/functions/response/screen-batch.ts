import { inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "~/services/response";
import { screenBatchChannel } from "../../channels/client";
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
  async ({ events, step, publish, runId }) => {
    console.log(`🚀 Запуск batch оценки для ${events.length} событий`);

    // Собираем все responseIds из всех событий
    const allResponseIds = events.flatMap((evt) => evt.data.responseIds);
    const workspaceId = events[0]?.data.workspaceId;
    const batchId = runId;

    console.log(`📋 Всего откликов для оценки: ${allResponseIds.length}`);

    // Получаем отклики с полной информацией
    const responses = await step.run("fetch-responses", async () => {
      const results = await db.query.response.findMany({
        where: inArray(response.id, allResponseIds),
        columns: {
          id: true,
        },
        with: {
          candidate: {
            columns: {
              name: true,
            },
          },
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

    // Публикуем начало batch обработки
    if (workspaceId) {
      await publish(
        screenBatchChannel(workspaceId, batchId)["batch-progress"]({
          batchId,
          total: responses.length,
          processed: 0,
          failed: 0,
        }),
      );
    }

    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;

    // Обрабатываем каждый отклик
    const results = await Promise.allSettled(
      responses.map(async (responseItem, index) => {
        return await step.run(
          `screen-response-${responseItem.id}`,
          async () => {
            try {
              console.log(`🎯 Скрининг отклика: ${responseItem.id}`);

              const candidateName =
                responseItem.candidate?.name || "Кандидат без имени";

              // Публикуем начало обработки отклика
              if (workspaceId) {
                await publish(
                  screenBatchChannel(workspaceId, batchId)["response-scored"]({
                    batchId,
                    responseId: responseItem.id,
                    candidateName,
                    score: 0,
                    status: "processing",
                  }),
                );
              }

              const resultWrapper = await screenResponse(responseItem.id);
              const result = unwrap(resultWrapper);

              processedCount++;

              // Публикуем результат оценки
              if (workspaceId) {
                await publish(
                  screenBatchChannel(workspaceId, batchId)["response-scored"]({
                    batchId,
                    responseId: responseItem.id,
                    candidateName,
                    score: result.score,
                    status: "completed",
                  }),
                );

                // Обновляем общий прогресс
                const nextCandidate = responses[index + 1];
                await publish(
                  screenBatchChannel(workspaceId, batchId)["batch-progress"]({
                    batchId,
                    total: responses.length,
                    processed: processedCount,
                    failed: failedCount,
                    currentCandidate: nextCandidate?.candidate?.name,
                  }),
                );
              }

              console.log(`✅ Скрининг завершен: ${responseItem.id}`, {
                score: result.score,
              });

              return {
                responseId: responseItem.id,
                success: true,
                score: result.score,
              };
            } catch (error) {
              failedCount++;

              console.error(
                `❌ Ошибка скрининга для ${responseItem.id}:`,
                error,
              );

              const candidateName =
                responseItem.candidate?.name || "Кандидат без имени";
              const errorMessage =
                error instanceof Error ? error.message : "Неизвестная ошибка";

              // Публикуем ошибку
              if (workspaceId) {
                await publish(
                  screenBatchChannel(workspaceId, batchId)["response-scored"]({
                    batchId,
                    responseId: responseItem.id,
                    candidateName,
                    score: 0,
                    status: "failed",
                    error: errorMessage,
                  }),
                );

                // Обновляем общий прогресс
                await publish(
                  screenBatchChannel(workspaceId, batchId)["batch-progress"]({
                    batchId,
                    total: responses.length,
                    processed: processedCount,
                    failed: failedCount,
                  }),
                );
              }

              return {
                responseId: responseItem.id,
                success: false,
                error: errorMessage,
              };
            }
          },
        );
      }),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Публикуем завершение batch обработки
    if (workspaceId) {
      await publish(
        screenBatchChannel(workspaceId, batchId)["batch-completed"]({
          batchId,
          total: responses.length,
          processed: successful,
          failed,
          duration,
        }),
      );
    }

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
