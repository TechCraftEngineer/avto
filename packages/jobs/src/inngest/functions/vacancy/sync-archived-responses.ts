import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";
import { runHHArchivedVacancyParser } from "@qbs-autonaim/jobs-parsers";
import {
  syncArchivedResponsesChannel,
  workspaceNotificationsChannel,
} from "../../channels/client";
import { isHHAuthError } from "../../../utils/hh-auth-error";
import { inngest } from "../../client";
import { collectChatIdsForVacancy } from "../../../services/collect-chat-ids";
import { screenNewResponsesForVacancy } from "../../../services/screen-new-responses";

/**
 * Inngest функция для синхронизации всех откликов архивной вакансии
 * Парсит все страницы откликов архивной вакансии через Puppeteer в headless режиме
 * ENGLISH_IDENTIFIERS_EXCEPTION: Технические идентификаторы функции (id, name) и шагов (step.run)
 * оставлены на английском языке, так как они используются для внутренней коммуникации между сервисами
 */
export const syncArchivedVacancyResponsesFunction = inngest.createFunction(
  {
    id: "sync-archived-vacancy-responses",
    name: "Sync Archived Vacancy Responses",
    retries: 1,
    concurrency: 1,
  },
  { event: "vacancy/responses.sync-archived" },
  async ({ event, step, publish }) => {
    const { vacancyId, workspaceId } = event.data;

    await publish(
      syncArchivedResponsesChannel(vacancyId).progress({
        vacancyId,
        status: "started",
        message: "Начинаем синхронизацию архивных откликов",
      }),
    );

    const result = await step.run("sync-archived-responses", async () => {
      console.log(
        `🚀 Запуск синхронизации архивных откликов для вакансии ${vacancyId}`,
      );

      const vacancyData = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, vacancyId),
      });

      if (!vacancyData) {
        await publish(
          syncArchivedResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "error",
            message: `Вакансия ${vacancyId} не найдена`,
          }),
        );
        throw new Error(`Вакансия ${vacancyId} не найдена`);
      }

      if (vacancyData.workspaceId !== workspaceId) {
        await publish(
          syncArchivedResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "error",
            message: `Вакансия ${vacancyId} не принадлежит рабочему пространству ${workspaceId}`,
          }),
        );
        throw new Error(
          `Вакансия ${vacancyId} не принадлежит рабочему пространству ${workspaceId}`,
        );
      }

      const publication = await db.query.vacancyPublication.findFirst({
        where: (pub, { and, eq }) =>
          and(eq(pub.vacancyId, vacancyId), eq(pub.platform, "HH")),
      });

      if (!publication) {
        await publish(
          syncArchivedResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "error",
            message: "Вакансия не опубликована на HH.ru",
          }),
        );
        throw new Error("Вакансия не опубликована на HH.ru");
      }

      if (!publication.externalId && !publication.url) {
        await publish(
          syncArchivedResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "error",
            message: "У публикации нет externalId или URL для синхронизации",
          }),
        );
        throw new Error(
          "У публикации нет externalId или URL для синхронизации",
        );
      }

      try {
        await publish(
          syncArchivedResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "processing",
            message: "Подключение к HeadHunter...",
          }),
        );

        let lastPublishTime = 0;
        const THROTTLE_INTERVAL = 2000;

        const onProgress = async (
          processed: number,
          total: number,
          newCount: number,
          currentName?: string,
        ) => {
          const now = Date.now();
          if (now - lastPublishTime < THROTTLE_INTERVAL && processed < total) {
            return;
          }
          lastPublishTime = now;

          const progressPercent =
            total > 0 ? Math.round((processed / total) * 100) : 0;
          const message = currentName
            ? `Обработано ${processed}/${total} (${progressPercent}%). Обрабатывается: ${currentName}`
            : `Обработано ${processed}/${total} (${progressPercent}%). Новых: ${newCount}`;

          await publish(
            syncArchivedResponsesChannel(vacancyId).progress({
              vacancyId,
              status: "processing",
              message,
              syncedResponses: processed,
              newResponses: newCount,
              totalResponses: total,
            }),
          );
        };

        const { syncedResponses, newResponses } =
          await runHHArchivedVacancyParser({
            workspaceId,
            vacancyId,
            externalId: publication.externalId,
            onProgress,
          } as Parameters<typeof runHHArchivedVacancyParser>[0]);

        await db
          .update(vacancyPublication)
          .set({ lastSyncedAt: new Date() })
          .where(eq(vacancyPublication.id, publication.id));

        console.log(
          `✅ Архивные отклики для вакансии ${vacancyId} синхронизированы успешно`,
        );

        return {
          success: true,
          vacancyId,
          syncedResponses,
          newResponses,
          vacancyTitle: vacancyData.title,
        };
      } catch (error) {
        console.error(
          `❌ Ошибка при синхронизации архивных откликов вакансии ${vacancyId}:`,
          error,
        );

        await publish(
          syncArchivedResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "error",
            message:
              error instanceof Error ? error.message : "Ошибка синхронизации",
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

    await step.run("collect-chat-ids", async () => {
      await publish(
        syncArchivedResponsesChannel(vacancyId).progress({
          vacancyId,
          status: "processing",
          message: "Сбор chat_id и сопроводительных писем...",
        }),
      );

      const { updatedCount } = await collectChatIdsForVacancy(vacancyId, {
        silent: true,
      });

      console.log(`✅ Сбор chat_id завершен. Обновлено: ${updatedCount}`);
      return { success: true, updatedCount };
    });

    const screeningResult = await step.run("screen-new-responses", async () => {
      const { processed, failed, total } =
        await screenNewResponsesForVacancy(vacancyId, {
          onProgress: async (progress) => {
            await publish(
              syncArchivedResponsesChannel(vacancyId).progress({
                vacancyId,
                status: "processing",
                message: `Оценено откликов: ${progress.processed + progress.failed} из ${progress.total}`,
                screenedTotal: progress.total,
                screenedProcessed: progress.processed,
                screenedFailed: progress.failed,
              }),
            );
          },
        });

      return { processed, failed, total };
    });

    const vacancyData = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
      columns: { title: true, workspaceId: true },
    });

    await publish(
      syncArchivedResponsesChannel(vacancyId).result({
        vacancyId,
        success: true,
        syncedResponses: result.syncedResponses,
        newResponses: result.newResponses,
        totalResponses: result.syncedResponses,
        vacancyTitle: result.vacancyTitle ?? vacancyData?.title ?? "",
        screenedProcessed: screeningResult?.processed,
        screenedFailed: screeningResult?.failed,
      }),
    );

    if (
      screeningResult &&
      screeningResult.processed > 0 &&
      vacancyData?.workspaceId
    ) {
      await publish(
        workspaceNotificationsChannel(vacancyData.workspaceId)["task-completed"]({
          workspaceId: vacancyData.workspaceId,
          taskType: "screening",
          taskId: vacancyId,
          success: true,
          message: `Оценено ${screeningResult.processed} новых откликов`,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    return {
      ...result,
      screenedProcessed: screeningResult?.processed,
      screenedFailed: screeningResult?.failed,
    };
  },
);
