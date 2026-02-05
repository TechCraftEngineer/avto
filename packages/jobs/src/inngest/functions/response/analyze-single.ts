import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response, vacancy } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "~/services/response";
import {
  analyzeResponseChannel,
  workspaceNotificationsChannel,
} from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для анализа одного отклика
 */
export const analyzeSingleResponseFunction = inngest.createFunction(
  {
    id: "analyze-single-response",
    name: "Analyze Single Response",
  },
  { event: "response/analyze.single" },
  async ({ event, step, publish }) => {
    const { responseId } = event.data;

    console.log(`🚀 Запуск анализа отклика: ${responseId}`);

    // Отправляем уведомление о начале
    await publish(
      analyzeResponseChannel(responseId).progress({
        responseId,
        status: "started",
        message: "Начинаем анализ отклика…",
      }),
    );

    // Проверяем существование отклика
    const responseData = await step.run("check-response", async () => {
      const resp = await db.query.response.findFirst({
        where: eq(response.id, responseId),
        columns: {
          id: true,
          entityId: true,
          entityType: true,
        },
      });

      if (!resp) {
        throw new Error("Отклик не найден");
      }

      if (resp.entityType !== "vacancy") {
        throw new Error("Отклик не относится к вакансии");
      }

      return resp;
    });

    // Проверяем, есть ли уже скрининг
    const existingScreening = await step.run("check-screening", async () => {
      return await db.query.responseScreening.findFirst({
        where: (screening, { eq }) => eq(screening.responseId, responseId),
        columns: {
          id: true,
        },
      });
    });

    if (existingScreening) {
      console.log("ℹ️ Отклик уже проанализирован ранее");

      await publish(
        analyzeResponseChannel(responseId).result({
          responseId,
          success: false,
          error: "Отклик уже был проанализирован ранее",
        }),
      );

      return {
        success: false,
        error: "Отклик уже был проанализирован ранее",
      };
    }

    // Отправляем прогресс
    await publish(
      analyzeResponseChannel(responseId).progress({
        responseId,
        status: "analyzing",
        message: "Анализируем отклик с помощью AI…",
      }),
    );

    // Выполняем скрининг
    const result = await step.run("screen-response", async () => {
      try {
        console.log(`🎯 Скрининг отклика: ${responseId}`);

        const resultWrapper = await screenResponse(responseId);
        const screeningResult = unwrap(resultWrapper);

        console.log(`✅ Скрининг завершен: ${responseId}`, {
          score: screeningResult.score,
        });

        return {
          success: true as const,
          score: screeningResult.score,
        };
      } catch (error) {
        console.error(`❌ Ошибка скрининга для ${responseId}:`, error);
        return {
          success: false as const,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        };
      }
    });

    // Отправляем финальный результат
    await publish(
      analyzeResponseChannel(responseId).result(
        result.success
          ? {
              responseId,
              success: true as const,
              score: result.score,
              error: undefined,
            }
          : {
              responseId,
              success: false as const,
              score: undefined,
              error: result.error,
            },
      ),
    );

    // Отправляем уведомление о завершении задачи
    if (result.success) {
      const vacancyData = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, responseData.entityId),
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
            taskId: responseId,
            success: true,
            message: `Отклик успешно проанализирован`,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }

    return result;
  },
);
