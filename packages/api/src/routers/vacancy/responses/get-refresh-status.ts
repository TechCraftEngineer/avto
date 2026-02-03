import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

/**
 * Получить статус задания обновления откликов вакансии
 * Использует Inngest REST API v1:
 * 1. GET /v1/events - получить последние события vacancy/responses.refresh
 * 2. GET /v1/events/{eventId}/runs - получить запуски для найденного события
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
        };
      }

      // Шаг 1: Получаем последние события vacancy/responses.refresh
      const eventsUrl = `${inngestBaseUrl}/v1/events?name=vacancy/responses.refresh`;

      console.log(
        `Получение событий для вакансии ${vacancyId}, URL: ${eventsUrl}`,
      );

      const eventsResponse = await fetch(eventsUrl, {
        headers: {
          Authorization: `Bearer ${inngestSigningKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!eventsResponse.ok) {
        console.error(
          `Ошибка при запросе событий Inngest (${eventsResponse.status}):`,
          eventsResponse.statusText,
        );
        return {
          isRunning: false,
          status: null,
          message: null,
        };
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
        // Нет событий для этой вакансии
        return {
          isRunning: false,
          status: null,
          message: null,
        };
      }

      // Шаг 2: Получаем запуски для найденного события
      const runsUrl = `${inngestBaseUrl}/v1/events/${vacancyEvent.id}/runs`;

      console.log(
        `Получение запусков для события ${vacancyEvent.id}, URL: ${runsUrl}`,
      );

      const runsResponse = await fetch(runsUrl, {
        headers: {
          Authorization: `Bearer ${inngestSigningKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!runsResponse.ok) {
        console.error(
          `Ошибка при запросе запусков Inngest (${runsResponse.status}):`,
          runsResponse.statusText,
        );
        return {
          isRunning: false,
          status: null,
          message: null,
        };
      }

      const runs = (await runsResponse.json()) as Array<{
        run_id: string;
        status: "Running" | "Completed" | "Failed" | "Cancelled" | "Queued";
        function_id: string;
        run_started_at: string;
        ended_at?: string;
      }>;

      // Проверяем есть ли активные запуски
      const activeRun = runs.find(
        (run) => run.status === "Running" || run.status === "Queued",
      );

      const isRunning = !!activeRun;

      console.log(
        `Статус задания для вакансии ${vacancyId}: ${isRunning ? "выполняется" : "завершено"}`,
      );

      return {
        isRunning,
        status: isRunning ? ("processing" as const) : null,
        message: isRunning ? "Обновление откликов выполняется…" : null,
      };
    } catch (error) {
      console.error("Ошибка при проверке статуса задания:", error);
      return {
        isRunning: false,
        status: null,
        message: null,
      };
    }
  });
