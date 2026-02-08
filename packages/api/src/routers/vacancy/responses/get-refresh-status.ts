import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

/**
 * Получить детальный статус задания обновления откликов вакансии
 *
 * Использует Inngest REST API v1:
 * 1. GET /v1/events - получить последние события
 * 2. GET /v1/events/{eventId}/runs - получить запуски
 * 3. GET /v1/runs/{runId} - получить детали запуска с output
 *
 * Возвращает:
 * - Факт выполнения задания
 * - Тип события (для определения режима)
 * - Детали прогресса (если доступны из output)
 * - Сообщение о статусе
 *
 * Отслеживаемые события:
 * - vacancy/responses.refresh - обновление откликов
 * - vacancy/responses.sync-archived - синхронизация архивных откликов
 * - response/resume.parse-new - парсинг новых резюме
 * - response/screen.new - скрининг новых откликов
 * - response/screen.all - скрининг всех откликов
 * - response/screen.batch - batch скрининг откликов
 */
export const getRefreshStatus = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string().min(1, "ID вакансии обязателен"),
    }),
  )
  .query(async ({ input }) => {
    const { vacancyId } = input;

    try {
      // Получаем конфигурацию Inngest из переменных окружения
      const inngestSigningKey = process.env.INNGEST_SIGNING_KEY;
      const inngestBaseUrl =
        process.env.INNGEST_BASE_URL ||
        process.env.INNGEST_EVENT_API_BASE_URL ||
        "https://api.inngest.com";

      if (!inngestSigningKey) {
        console.warn("INNGEST_SIGNING_KEY не настроен");
        return {
          isRunning: false,
          status: null,
          message: null,
          eventType: null,
        };
      }

      // События, связанные с обработкой откликов
      const responseEventNames = [
        "vacancy/responses.refresh",
        "vacancy/responses.sync-archived",
        "response/resume.parse-new",
        "response/screen.new",
        "response/screen.all",
        "response/screen.batch",
      ];

      // Проверяем каждое событие
      for (const eventName of responseEventNames) {
        const eventsUrl = `${inngestBaseUrl}/v1/events?name=${eventName}`;

        console.log(`Проверка события ${eventName} для вакансии ${vacancyId}`);

        const eventsResponse = await fetch(eventsUrl, {
          headers: {
            Authorization: `Bearer ${inngestSigningKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!eventsResponse.ok) {
          console.error(
            `Ошибка при запросе событий ${eventName} (${eventsResponse.status}):`,
            eventsResponse.statusText,
          );
          continue;
        }

        const eventsData = (await eventsResponse.json()) as {
          data: Array<{
            id: string;
            name: string;
            ts: number;
            data: {
              vacancyId?: string;
            };
          }>;
        };

        // Находим событие для нашей вакансии
        const vacancyEvent = eventsData.data?.find(
          (event) => event.data?.vacancyId === vacancyId,
        );

        if (!vacancyEvent) {
          continue;
        }

        // Получаем запуски для найденного события
        const runsUrl = `${inngestBaseUrl}/v1/events/${vacancyEvent.id}/runs`;

        console.log(
          `Получение запусков для события ${eventName} (${vacancyEvent.id})`,
        );

        const runsResponse = await fetch(runsUrl, {
          headers: {
            Authorization: `Bearer ${inngestSigningKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!runsResponse.ok) {
          console.error(
            `Ошибка при запросе запусков ${eventName} (${runsResponse.status}):`,
            runsResponse.statusText,
          );
          continue;
        }

        const runsData = (await runsResponse.json()) as {
          data: Array<{
            run_id: string;
            status: "Running" | "Completed" | "Failed" | "Cancelled" | "Queued";
            function_id: string;
            run_started_at: string;
            ended_at?: string;
            output?: unknown;
          }>;
        };

        // Проверяем есть ли активные запуски
        const activeRun = runsData.data?.find(
          (run) => run.status === "Running" || run.status === "Queued",
        );

        if (activeRun) {
          console.log(
            `Найден активный запуск для события ${eventName}, вакансия ${vacancyId}`,
          );

          // Определяем сообщение в зависимости от типа события
          let message = "Обновление откликов выполняется…";
          if (eventName === "vacancy/responses.sync-archived") {
            message = "Синхронизация архивных откликов выполняется…";
          } else if (eventName === "response/screen.new") {
            message = "Скрининг новых откликов выполняется…";
          } else if (eventName === "response/screen.all") {
            message = "Скрининг всех откликов выполняется…";
          } else if (eventName === "response/resume.parse-new") {
            message = "Парсинг новых резюме выполняется…";
          }

          // Пытаемся получить детали прогресса из запуска
          let progressDetails = null;
          try {
            const runDetailsUrl = `${inngestBaseUrl}/v1/runs/${activeRun.run_id}`;
            const runDetailsResponse = await fetch(runDetailsUrl, {
              headers: {
                Authorization: `Bearer ${inngestSigningKey}`,
                "Content-Type": "application/json",
              },
            });

            if (runDetailsResponse.ok) {
              const runDetails = (await runDetailsResponse.json()) as {
                output?: {
                  currentPage?: number;
                  totalSaved?: number;
                  totalSkipped?: number;
                  total?: number;
                  processed?: number;
                  failed?: number;
                  newCount?: number;
                };
              };

              if (runDetails.output) {
                progressDetails = runDetails.output;
              }
            }
          } catch (error) {
            console.error("Ошибка при получении деталей запуска:", error);
          }

          return {
            isRunning: true,
            status: "processing" as const,
            message,
            eventType: eventName,
            progress: progressDetails,
            runId: activeRun.run_id,
            startedAt: activeRun.run_started_at,
          };
        }
      }

      // Не найдено активных запусков
      console.log(`Нет активных запусков для вакансии ${vacancyId}`);

      return {
        isRunning: false,
        status: null,
        message: null,
        eventType: null,
        progress: null,
        runId: null,
        startedAt: null,
      };
    } catch (error) {
      console.error("Ошибка при проверке статуса задания:", error);
      return {
        isRunning: false,
        status: null,
        message: null,
        eventType: null,
        progress: null,
        runId: null,
        startedAt: null,
      };
    }
  });
