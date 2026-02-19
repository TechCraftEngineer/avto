import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  fetchActiveListChannel,
  workspaceNotificationsChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import { isHHAuthError } from "../../utils/hh-auth-error";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fetchActiveVacanciesList } from "../../parsers/hh";

/**
 * Схема валидации входных данных для получения списка активных вакансий
 */
const FetchActiveListEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
  requestId: z.string().min(1, "ID запроса обязателен"),
});

/**
 * Inngest функция для получения списка активных вакансий из HH.ru
 * Возвращает список без полного импорта для выбора пользователем
 */
export const fetchActiveListFunction = inngest.createFunction(
  {
    id: "fetch-active-vacancies-list-parsers",
    name: "Получение списка активных вакансий (parsers)",
    retries: 0,
    concurrency: 5,
  },
  { event: "vacancy/fetch-active-list" },
  async ({ event, step, publish }) => {
    // Валидация входных данных
    const validationResult = FetchActiveListEventSchema.safeParse(event.data);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Некорректные данные запроса";
      console.error("❌ Ошибка валидации входных данных:", errorMessage);
      throw new Error(errorMessage);
    }

    const { workspaceId, requestId } = validationResult.data;

    await publish(
      fetchActiveListChannel(workspaceId, requestId).progress({
        workspaceId,
        requestId,
        status: "started",
        message: "Подключаемся к HeadHunter",
      }),
    );

    const result = await step.run("fetch-active-list", async () => {
      console.log(
        `🚀 Получение списка активных вакансий для workspace ${workspaceId}`,
      );

      try {
        await publish(
          fetchActiveListChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "processing",
            message: "Загружаем список активных вакансий",
          }),
        );

        // Получаем список активных вакансий
        const rawVacancies = await fetchActiveVacanciesList(workspaceId);

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
            isImported: existingExternalIds.has(v.externalId ?? ""),
          }));

        await publish(
          fetchActiveListChannel(workspaceId, requestId).result({
            workspaceId,
            requestId,
            success: true,
            vacancies,
          }),
        );

        console.log(
          `✅ Получено ${vacancies.length} активных вакансий для workspace ${workspaceId}`,
        );

        return { success: true, vacancies };
      } catch (error) {
        console.error(
          `❌ Ошибка при получении списка активных вакансий для workspace ${workspaceId}:`,
          error,
        );

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Не удалось получить список вакансий";

        await publish(
          fetchActiveListChannel(workspaceId, requestId).result({
            workspaceId,
            requestId,
            success: false,
            error: errorMessage,
          }),
        );

        if (isHHAuthError(error)) {
          await publish(
            workspaceNotificationsChannel(workspaceId)["integration-error"]({
              workspaceId,
              type: "hh-auth-failed",
              message:
                "Авторизация в HeadHunter слетела. Проверьте учётные данные в настройках интеграции.",
              severity: "error",
              timestamp: new Date().toISOString(),
            }),
          );
        }

        throw error;
      }
    });

    return result;
  },
);
