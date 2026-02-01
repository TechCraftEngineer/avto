import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { fetchArchivedVacanciesList } from "@qbs-autonaim/jobs-parsers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
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
        const rawVacancies = await fetchArchivedVacanciesList(workspaceId);

        // Получаем список externalId для проверки в базе
        const validExternalIds = rawVacancies
          .filter((v) => v.externalId)
          .map((v) => v.externalId);

        // Проверяем, какие вакансии уже загружены в базу
        const existingVacancies =
          validExternalIds.length > 0
            ? await db
                .select({ externalId: vacancy.externalId })
                .from(vacancy)
                .where(
                  and(
                    eq(vacancy.workspaceId, workspaceId),
                    eq(vacancy.source, "HH"),
                  ),
                )
            : [];

        const existingExternalIds = new Set(
          existingVacancies
            .map((v) => v.externalId)
            .filter((id): id is string => id !== null),
        );

        // Преобразуем данные в формат, ожидаемый каналом, добавляем флаг isImported
        const vacancies = rawVacancies
          .filter((v) => v.externalId)
          .map((v) => ({
            id: v.externalId ?? "",
            title: v.title || "",
            region: v.region,
            archivedAt: v.archivedAt,
            isImported: existingExternalIds.has(v.externalId ?? ""),
          }));

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
