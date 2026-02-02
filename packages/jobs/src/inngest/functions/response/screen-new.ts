import { and, eq, inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response, responseScreening, vacancy } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "~/services/response";
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

      // Если нет откликов, возвращаем пустой массив
      if (allResponses.length === 0) {
        return [];
      }

      // Получаем ID откликов, у которых уже есть скрининг
      const responseIds = allResponses.map((r) => r.id);
      const screenedResponseIds = await db.query.responseScreening.findMany({
        where: (screening, { inArray }) =>
          inArray(screening.responseId, responseIds),
        columns: {
          responseId: true,
        },
      });

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

    // Отправляем уведомление о завершении задачи
    if (successful > 0) {
      // Получаем workspaceId вакансии для уведомления
      const vacancyData = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, vacancyId),
        columns: {
          workspaceId: true,
        },
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
            message: `Оценено ${successful} новых откликов`,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }

    return {
      success: true,
      total: responses.length,
      processed: successful,
      failed,
    };
  },
);
