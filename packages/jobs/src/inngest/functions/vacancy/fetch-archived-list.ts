import { z } from "zod";
import { fetchArchivedVacanciesList } from "../../../parsers/hh";
import { fetchArchivedListChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Схема валидации входных данных для получения списка архивных вакансий
 */
const FetchArchivedListEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
  requestId: z.string().min(1, "ID запроса обязателен"),
});

/**
 * Inngest функция для получения списка архивных вакансий из HH.ru
 * Возвращает список без полного импорта для выбора пользователем
 */
export const fetchArchivedListFunction = inngest.createFunction(
  {
    id: "fetch-archived-vacancies-list",
    name: "Получение списка архивных вакансий",
    retries: 0,
    concurrency: 5,
  },
  { event: "vacancy/fetch-archived-list" },
  async ({ event, step, publish }) => {
    // Валидация входных данных
    const validationResult = FetchArchivedListEventSchema.safeParse(event.data);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Некорректные данные запроса";
      console.error("❌ Ошибка валидации входных данных:", errorMessage);
      throw new Error(errorMessage);
    }

    const { workspaceId, requestId } = validationResult.data;

    await publish(
      fetchArchivedListChannel(workspaceId, requestId).progress({
        workspaceId,
        requestId,
        status: "started",
        message: "Подключаемся к HeadHunter",
      }),
    );

    const result = await step.run("fetch-archived-list", async () => {
      console.log(
        `🚀 Получение списка архивных вакансий для workspace ${workspaceId}`,
      );

      try {
        await publish(
          fetchArchivedListChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "processing",
            message: "Загружаем список архивных вакансий",
          }),
        );

        // Получаем список архивных вакансий
        const vacancies = await fetchArchivedVacanciesList(workspaceId);

        await publish(
          fetchArchivedListChannel(workspaceId, requestId).result({
            workspaceId,
            requestId,
            success: true,
            vacancies,
          }),
        );

        console.log(
          `✅ Получено ${vacancies.length} архивных вакансий для workspace ${workspaceId}`,
        );

        return { success: true, vacancies };
      } catch (error) {
        console.error(
          `❌ Ошибка при получении списка архивных вакансий для workspace ${workspaceId}:`,
          error,
        );

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Не удалось получить список вакансий";

        await publish(
          fetchArchivedListChannel(workspaceId, requestId).result({
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
