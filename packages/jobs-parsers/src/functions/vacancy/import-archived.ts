import {
  importArchivedVacanciesChannel,
  workspaceNotificationsChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";
import { importMultipleVacancies } from "../../parsers/hh";

/**
 * Определяет, является ли ошибка связанной с авторизацией HH.ru
 */
function isHHAuthError(error: unknown): boolean {
  if (!error) return false;

  const message =
    error instanceof Error ? error.message : String(error).toLowerCase();
  const msg = message.toLowerCase();

  // Типичные фразы при слетевшей авторизации
  const authPhrases = [
    "не удалось войти",
    "не удалось авторизоваться",
    "авторизация не удалась",
    "авторизация слетела",
    "требуется повторная авторизация",
    "требуется повторная настройка интеграции",
    "не найдены учетные данные для hh",
  ];

  return authPhrases.some((phrase) => msg.includes(phrase.toLowerCase()));
}

/**
 * Схема валидации входных данных для импорта архивных вакансий
 */
const ImportArchivedVacanciesEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
  vacancies: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      region: z.string().optional(),
      archivedAt: z.string().optional(),
    }),
  ),
});

/**
 * Inngest функция для импорта выбранных архивных вакансий из HH.ru
 * Парсит только указанные вакансии с детальным прогрессом
 */
export const importArchivedVacanciesFunction = inngest.createFunction(
  {
    id: "import-archived-vacancies",
    name: "Импорт архивных вакансий",
    retries: 0,
    concurrency: 1,
  },
  { event: "vacancy/import.archived" },
  async ({ event, step, publish }) => {
    // Валидация входных данных
    const validationResult = ImportArchivedVacanciesEventSchema.safeParse(
      event.data,
    );

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Некорректные данные запроса";
      console.error("❌ Ошибка валидации входных данных:", errorMessage);
      throw new Error(errorMessage);
    }

    const { workspaceId, vacancies } = validationResult.data;

    // Инициализируем массив прогресса для всех вакансий
    const vacancyProgress: Array<{
      id: string;
      title: string;
      region?: string;
      workLocation?: string;
      archivedAt?: string;
      status: "pending" | "processing" | "success" | "failed";
      error?: string;
    }> = vacancies.map((v) => ({
      id: v.id,
      title: v.title,
      region: v.region,
      archivedAt: v.archivedAt,
      status: "pending",
    }));

    await publish(
      importArchivedVacanciesChannel(workspaceId).progress({
        workspaceId,
        status: "started",
        message: "Начинаем импорт архивных вакансий",
        total: vacancies.length,
        processed: 0,
        vacancies: vacancyProgress,
      }),
    );

    const result = await step.run("import-archived-vacancies", async () => {
      console.log(
        `🚀 Запуск импорта ${vacancies.length} архивных вакансий для workspace ${workspaceId}`,
      );

      try {
        let failed = 0;

        // Импортируем вакансии с прогрессом
        const vacanciesWithProgress = await importMultipleVacancies(
          workspaceId,
          vacancies.map((v) => ({
            url: v.url,
            date: v.archivedAt || "",
            region: v.region,
          })),
          async (index, success, error) => {
            // Обновляем статус текущей вакансии
            const currentVacancy = vacancies[index];
            if (!currentVacancy) return;

            vacancyProgress[index] = {
              id: currentVacancy.id,
              title: currentVacancy.title,
              region: currentVacancy.region,
              archivedAt: currentVacancy.archivedAt,
              status: success ? "success" : "failed",
              error,
            };

            if (!success) {
              failed++;
            }

            // Отправляем обновленный прогресс
            const nextVacancy = vacancies[index + 1];
            await publish(
              importArchivedVacanciesChannel(workspaceId).progress({
                workspaceId,
                status: "processing",
                message: `Обработано ${index + 1} из ${vacancies.length} вакансий`,
                total: vacancies.length,
                processed: index + 1,
                failed,
                currentVacancy: nextVacancy
                  ? {
                      id: nextVacancy.id,
                      title: nextVacancy.title,
                    }
                  : undefined,
                vacancies: [...vacancyProgress],
              }),
            );
          },
          { isArchived: true },
        );

        await publish(
          importArchivedVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "completed",
            message: "Импорт завершён",
            total: vacancies.length,
            processed: vacancies.length,
            failed,
            vacancies: vacancyProgress,
          }),
        );

        await publish(
          importArchivedVacanciesChannel(workspaceId).result({
            workspaceId,
            success: true,
            imported: vacanciesWithProgress.imported,
            updated: vacanciesWithProgress.updated,
            failed: vacanciesWithProgress.failed,
          }),
        );

        // Отправляем уведомление о завершении
        await publish(
          workspaceNotificationsChannel(workspaceId)["task-completed"]({
            workspaceId,
            taskType: "import",
            taskId: workspaceId,
            success: true,
            message: `Импортировано ${vacanciesWithProgress.imported} архивных вакансий`,
            timestamp: new Date().toISOString(),
          }),
        );

        console.log(
          `✅ Импорт архивных вакансий для workspace ${workspaceId} завершён`,
        );

        return { success: true, workspaceId };
      } catch (error) {
        console.error(
          `❌ Ошибка при импорте архивных вакансий для workspace ${workspaceId}:`,
          error,
        );

        let errorMessage = "Не удалось подключиться к источнику вакансий";
        
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        await publish(
          importArchivedVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "error",
            message: errorMessage,
          }),
        );

        await publish(
          importArchivedVacanciesChannel(workspaceId).result({
            workspaceId,
            success: false,
            imported: 0,
            updated: 0,
            failed: 0,
            error: errorMessage,
          }),
        );

        // Проверяем, является ли это ошибкой авторизации
        if (isHHAuthError(error)) {
          await publish(
            workspaceNotificationsChannel(workspaceId)["integration-error"]({
              workspaceId,
              type: "hh-auth-failed",
              message:
                "Авторизация в HeadHunter слетела. Проверьте учётные данные в настройках интеграции",
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
