import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response, responseScreening } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "~/services/response";
import { screenNewResponsesChannel } from "../../channels/client";
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

    // Отправляем уведомление о начале
    await publish(
      screenNewResponsesChannel(vacancyId).progress({
        vacancyId,
        status: "started",
        message: "Начинаем поиск новых откликов...",
      }),
    );

    // Получаем новые отклики (без скрининга)
    const responses = await step.run("fetch-new-responses", async () => {
      // Получаем все отклики для вакансии
      const allResponses = await db.query.response.findMany({
        where: and(
          eq(response.entityType, "vacancy"),
          eq(response.entityId, vacancyId),
        ),
        columns: {
          id: true,
          entityId: true,
        },
      });

      // Получаем ID откликов, у которых уже есть скрининг
      const screenedResponseIds = await db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .where(
          eq(
            responseScreening.responseId,
            allResponses.map((r) => r.id)[0] ?? "",
          ),
        );

      const screenedIds = new Set(screenedResponseIds.map((s) => s.responseId));

      // Фильтруем только отклики без скрининга
      const results = allResponses.filter((r) => !screenedIds.has(r.id));

      console.log(`✅ Найдено новых откликов: ${results.length}`);
      return results;
    });

    if (responses.length === 0) {
      console.log("ℹ️ Нет новых откликов для оценки");

      await publish(
        screenNewResponsesChannel(vacancyId).result({
          vacancyId,
          success: true,
          total: 0,
          processed: 0,
          failed: 0,
        }),
      );

      return {
        success: true,
        total: 0,
        processed: 0,
        failed: 0,
      };
    }

    // Отправляем прогресс о найденных откликах
    await publish(
      screenNewResponsesChannel(vacancyId).progress({
        vacancyId,
        status: "processing",
        message: `Найдено ${responses.length} новых откликов. Начинаем оценку...`,
        total: responses.length,
        processed: 0,
        failed: 0,
      }),
    );

    // Обрабатываем каждый отклик
    const results = await Promise.allSettled(
      responses.map(async (resp) => {
        return await step.run(`screen-response-${resp.id}`, async () => {
          try {
            console.log(`🎯 Скрининг отклика: ${resp.id}`);

            const resultWrapper = await screenResponse(resp.id);
            const result = unwrap(resultWrapper);

            console.log(`✅ Скрининг завершен: ${resp.id}`, {
              score: result.score,
            });

            return {
              responseId: resp.id,
              vacancyId: resp.entityId,
              success: true,
              score: result.score,
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

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length;
    const failed = results.filter(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && !r.value.success),
    ).length;

    console.log(
      `✅ Завершено: успешно ${successful}, ошибок ${failed} из ${responses.length}`,
    );

    // Отправляем финальный результат
    await publish(
      screenNewResponsesChannel(vacancyId).result({
        vacancyId,
        success: true,
        total: responses.length,
        processed: successful,
        failed,
      }),
    );

    return {
      success: true,
      total: responses.length,
      processed: successful,
      failed,
    };
  },
);
