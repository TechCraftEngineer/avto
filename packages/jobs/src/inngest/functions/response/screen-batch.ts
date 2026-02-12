import { inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "../../../services/response";
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
  async ({ events, step, publish }) => {
    console.log(`🚀 Запуск batch оценки для ${events.length} событий`);

    // Validate single workspace per batch
    const workspaceIds = [...new Set(events.map((e) => e.data.workspaceId))];
    if (workspaceIds.length > 1) {
      throw new Error(
        `Пакетная обработка может выполняться только в рамках одного рабочего пространства. Найдены пространства: ${workspaceIds.join(", ")}`,
      );
    }

    const workspaceId = workspaceIds[0];
    const batchId = crypto.randomUUID();

    // Собираем все responseIds из всех событий
    const allResponseIds = events.flatMap((evt) => evt.data.responseIds);

    console.log(`📋 Всего откликов для оценки: ${allResponseIds.length}`);

    // Получаем отклики с полной информацией
    const responses = await step.run("fetch-responses", async () => {
      const results = await db.query.response.findMany({
        where: inArray(response.id, allResponseIds),
        columns: {
          id: true,
        },
        with: {
          globalCandidate: {
            columns: {
              firstName: true,
              lastName: true,
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
    const _results = await Promise.allSettled(
      responses.map(async (responseItem, index) => {
        return await step.run(
          `screen-response-${responseItem.id}`,
          async () => {
            try {
              console.log(`🎯 Скрининг отклика: ${responseItem.id}`);

              const candidateName = responseItem.globalCandidate
                ? `${responseItem.globalCandidate.firstName || ""} ${responseItem.globalCandidate.lastName || ""}`.trim() ||
                  "Кандидат без имени"
                : "Кандидат без имени";

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
                    score: result.detailedScore,
                    status: "completed",
                  }),
                );

                // Обновляем общий прогресс
                const nextCandidate = responses[index + 1];
                const nextCandidateName = nextCandidate?.globalCandidate
                  ? `${nextCandidate.globalCandidate.firstName || ""} ${nextCandidate.globalCandidate.lastName || ""}`.trim()
                  : undefined;
                await publish(
                  screenBatchChannel(workspaceId, batchId)["batch-progress"]({
                    batchId,
                    total: responses.length,
                    processed: processedCount,
                    failed: failedCount,
                    currentCandidate: nextCandidateName,
                  }),
                );
              }

              console.log(`✅ Скрининг завершен: ${responseItem.id}`, {
                score: result.detailedScore,
              });

              return {
                responseId: responseItem.id,
                success: true,
                score: result.detailedScore,
              };
            } catch (error) {
              failedCount++;

              console.error(
                `❌ Ошибка скрининга для ${responseItem.id}:`,
                error,
              );

              const candidateName = responseItem.globalCandidate
                ? `${responseItem.globalCandidate.firstName || ""} ${responseItem.globalCandidate.lastName || ""}`.trim() ||
                  "Кандидат без имени"
                : "Кандидат без имени";
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

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Публикуем завершение batch обработки
    if (workspaceId) {
      await publish(
        screenBatchChannel(workspaceId, batchId)["batch-completed"]({
          batchId,
          total: responses.length,
          processed: processedCount,
          failed: failedCount,
          duration,
        }),
      );
    }

    console.log(
      `✅ Завершено: успешно ${processedCount}, ошибок ${failedCount} из ${responses.length}`,
    );

    return {
      success: true,
      total: responses.length,
      processed: processedCount,
      failed: failedCount,
    };
  },
);
