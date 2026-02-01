import { importSingleVacancy } from "@qbs-autonaim/jobs-parsers";
import {
  extractExternalIdFromUrl,
  ImportByUrlSchema,
} from "@qbs-autonaim/validators";
import { importVacancyByUrlChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для импорта вакансии по ссылке
 * Парсит одну конкретную вакансию по её URL
 */
export const importVacancyByUrlFunction = inngest.createFunction(
  {
    id: "import-vacancy-by-url",
    name: "Импорт вакансии по ссылке",
    retries: 1,
    concurrency: 5,
  },
  { event: "vacancy/import.by-url" },
  async ({ event, step, publish }) => {
    const { workspaceId, url, requestId } = event.data;

    await publish(
      importVacancyByUrlChannel(workspaceId, requestId).progress({
        workspaceId,
        requestId,
        status: "started",
        message: "Начинаем импорт вакансии",
      }),
    );

    const result = await step.run("import-vacancy-by-url", async () => {
      console.log(
        `🚀 Запуск импорта вакансии по ссылке для workspace ${workspaceId}`,
      );

      try {
        // Валидация URL
        await publish(
          importVacancyByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "validating",
            message: "Проверяем ссылку",
          }),
        );

        const validationResult = ImportByUrlSchema.safeParse({ url });

        if (!validationResult.success) {
          const errorMessage =
            validationResult.error.issues[0]?.message ||
            "Введите корректную ссылку на вакансию с hh.ru";

          await publish(
            importVacancyByUrlChannel(workspaceId, requestId).progress({
              workspaceId,
              requestId,
              status: "error",
              message: errorMessage,
            }),
          );

          await publish(
            importVacancyByUrlChannel(workspaceId, requestId).result({
              workspaceId,
              requestId,
              success: false,
              error: errorMessage,
            }),
          );

          return {
            success: false,
            workspaceId,
            requestId,
            error: errorMessage,
          };
        }

        // Извлечение externalId
        const externalId = extractExternalIdFromUrl(url);

        if (!externalId) {
          const errorMessage = "Не удалось извлечь ID вакансии из ссылки";
          throw new Error(errorMessage);
        }

        // Получение данных вакансии
        await publish(
          importVacancyByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "fetching",
            message: "Получаем данные вакансии",
          }),
        );

        // Сохранение вакансии
        await publish(
          importVacancyByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "saving",
            message: "Сохраняем вакансию",
          }),
        );

        const result = await importSingleVacancy(
          workspaceId,
          `https://hh.ru/vacancy/${externalId}`,
        );

        if (!result.success || !result.vacancy) {
          throw new Error("Не удалось импортировать вакансию");
        }

        await publish(
          importVacancyByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "completed",
            message: "Вакансия импортирована",
          }),
        );

        const vacancyId = result.vacancy.id;

        await publish(
          importVacancyByUrlChannel(workspaceId, requestId).result({
            workspaceId,
            requestId,
            success: true,
            vacancyId,
          }),
        );

        console.log(
          `✅ Импорт вакансии ${vacancyId} для workspace ${workspaceId} завершён`,
        );

        return { success: true, workspaceId, vacancyId, isNew: result.isNew ?? false };
      } catch (error) {
        console.error(
          `❌ Ошибка при импорте вакансии для workspace ${workspaceId}:`,
          error,
        );

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Не удалось импортировать вакансию";

        await publish(
          importVacancyByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "error",
            message: errorMessage,
          }),
        );

        await publish(
          importVacancyByUrlChannel(workspaceId, requestId).result({
            workspaceId,
            requestId,
            success: false,
            error: errorMessage,
          }),
        );

        throw error;
      }
    });

    return result;
  },
);
