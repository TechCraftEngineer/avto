import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { runHHParser } from "@qbs-autonaim/jobs-parsers";
import { z } from "zod";
import {
  importNewVacanciesChannel,
  workspaceNotificationsChannel,
  workspaceStatsChannel,
} from "../../channels/client";
import { inngest } from "../../client";

/**
 * Схема валидации входных данных для импорта новых вакансий
 */
const ImportNewVacanciesEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
});

/**
 * Маппинг технических ошибок в понятные пользователю сообщения
 */
function mapErrorToUserMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    // Ошибки авторизации
    if (
      message.includes("Не найдены учетные данные") ||
      message.includes("credentials")
    ) {
      return "Не настроены учетные данные для HeadHunter";
    }

    if (message.includes("Логин не удался") || message.includes("Login")) {
      return "Не удалось войти в HeadHunter. Проверьте учетные данные";
    }

    // Ошибки сети
    if (
      message.includes("timeout") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ECONNREFUSED")
    ) {
      return "Не удалось подключиться к HeadHunter. Попробуйте позже";
    }

    if (message.includes("network") || message.includes("fetch")) {
      return "Ошибка сети. Проверьте подключение к интернету";
    }

    // Ошибки парсинга
    if (message.includes("parse") || message.includes("selector")) {
      return "Не удалось получить данные с HeadHunter. Возможно, изменился формат страницы";
    }

    // Общая ошибка с сохранением оригинального сообщения если оно понятное
    if (message.length < 100 && !message.includes("Error:")) {
      return message;
    }
  }

  return "Не удалось подключиться к источнику вакансий";
}

/**
 * Inngest функция для импорта новых вакансий из HH.ru
 * Парсит все активные вакансии работодателя
 */
export const importNewVacanciesFunction = inngest.createFunction(
  {
    id: "import-new-vacancies",
    name: "Импорт новых вакансий",
    retries: 0,
    concurrency: 1,
  },
  { event: "vacancy/import.new" },
  async ({ event, step, publish }) => {
    // Валидация входных данных
    const validationResult = ImportNewVacanciesEventSchema.safeParse(
      event.data,
    );

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Некорректные данные запроса";
      console.error("❌ Ошибка валидации входных данных:", errorMessage);
      throw new Error(errorMessage);
    }

    const { workspaceId } = validationResult.data;

    await publish(
      importNewVacanciesChannel(workspaceId).progress({
        workspaceId,
        status: "started",
        message: "Начинаем импорт активных вакансий",
      }),
    );

    const result = await step.run("import-new-vacancies", async () => {
      console.log(
        `🚀 Запуск импорта новых вакансий для workspace ${workspaceId}`,
      );

      try {
        await publish(
          importNewVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "processing",
            message: "Получаем вакансии с HeadHunter",
          }),
        );

        // Запускаем парсер HH для получения активных вакансий
        const parserResult = await runHHParser({
          workspaceId,
          skipResponses: true,
          includeArchived: false,
        });

        await publish(
          importNewVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "completed",
            message: "Импорт завершён",
          }),
        );

        await publish(
          importNewVacanciesChannel(workspaceId).result({
            workspaceId,
            success: true,
            imported: parserResult.imported,
            updated: parserResult.updated,
            failed: parserResult.failed,
          }),
        );

        // Отправляем realtime уведомление о завершении
        await publish(
          workspaceNotificationsChannel(workspaceId)["task-completed"]({
            workspaceId,
            taskType: "import",
            taskId: workspaceId,
            success: true,
            message: `Импортировано ${parserResult.imported} новых вакансий, обновлено ${parserResult.updated}`,
            timestamp: new Date().toISOString(),
          }),
        );

        // Обновляем статистику workspace
        if (parserResult.imported > 0 || parserResult.updated > 0) {
          // Получаем реальные totals из базы данных
          const [totalCountResult, activeCountResult] = await Promise.all([
            db.$count(vacancy, eq(vacancy.workspaceId, workspaceId)),
            db.$count(
              vacancy,
              and(
                eq(vacancy.workspaceId, workspaceId),
                eq(vacancy.isActive, true),
              ),
            ),
          ]);

          await publish(
            workspaceStatsChannel(workspaceId)["vacancies-updated"]({
              workspaceId,
              totalVacancies: totalCountResult,
              activeVacancies: activeCountResult,
              updatedAt: new Date().toISOString(),
            }),
          );
        }

        console.log(
          `✅ Импорт новых вакансий для workspace ${workspaceId} завершён`,
        );

        return { success: true, workspaceId };
      } catch (error) {
        console.error(
          `❌ Ошибка при импорте новых вакансий для workspace ${workspaceId}:`,
          error,
        );

        // Логируем оригинальную ошибку для отладки
        if (error instanceof Error) {
          console.error("Детали ошибки:", {
            message: error.message,
            stack: error.stack,
          });
        }

        // Маппим ошибку в понятное пользователю сообщение
        const userMessage = mapErrorToUserMessage(error);

        await publish(
          importNewVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "error",
            message: userMessage,
          }),
        );

        await publish(
          importNewVacanciesChannel(workspaceId).result({
            workspaceId,
            success: false,
            imported: 0,
            updated: 0,
            failed: 0,
            error: userMessage,
          }),
        );

        // Отправляем realtime уведомление об ошибке
        await publish(
          workspaceNotificationsChannel(workspaceId)["task-completed"]({
            workspaceId,
            taskType: "import",
            taskId: workspaceId,
            success: false,
            message: userMessage,
            timestamp: new Date().toISOString(),
          }),
        );

        throw error;
      }
    });

    return result;
  },
);
