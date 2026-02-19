import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";
import {
  runHHArchivedVacancyParserPage,
  runHHParseResponseDetailsForVacancy,
} from "@qbs-autonaim/jobs-parsers";
import { getResponsesLimitByOrganizationPlan } from "@qbs-autonaim/jobs-shared";
import {
  syncArchivedResponsesChannel,
  workspaceNotificationsChannel,
} from "../../channels/client";
import { isHHAuthError } from "../../../utils/hh-auth-error";
import { inngest } from "../../client";
import { collectChatIdsForVacancy } from "../../../services/collect-chat-ids";
import { screenNewResponsesForVacancy } from "../../../services/screen-new-responses";

/**
 * Inngest функция для синхронизации всех откликов архивной вакансии.
 * Разбита на шаги по страницам — при рестарте сервиса продолжит с последней страницы.
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

    const validation = await step.run("validate", async () => {
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

      const workspaceData = await db.query.workspace.findFirst({
        where: (w, { eq }) => eq(w.id, workspaceId),
        columns: { plan: true },
        with: { organization: { columns: { plan: true } } },
      });

      const organizationPlan =
        workspaceData?.organization?.plan ?? "free";
      const responsesLimit =
        getResponsesLimitByOrganizationPlan(organizationPlan);

      return {
        publicationId: publication.id,
        externalId: publication.externalId,
        vacancyTitle: vacancyData.title,
        responsesLimit: responsesLimit > 0 ? responsesLimit : 0,
      };
    });

    let pageIndex = 0;
    let accumulatedSynced = 0;
    let accumulatedNew = 0;
    let hasMore = true;

    while (hasMore) {
      const pageResult = await step.run(
        `sync-page-${pageIndex}`,
        async () => {
          try {
            await publish(
              syncArchivedResponsesChannel(vacancyId).progress({
                vacancyId,
                status: "processing",
                message: `Синхронизация страницы ${pageIndex + 1}...`,
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
                ? `Страница ${pageIndex + 1}: ${processed}/${total} (${progressPercent}%). ${currentName}`
                : `Страница ${pageIndex + 1}: ${processed}/${total} (${progressPercent}%). Новых: ${newCount}`;

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

            const result = await runHHArchivedVacancyParserPage({
              workspaceId,
              vacancyId,
              externalId: validation.externalId,
              pageOptions: {
                pageIndex,
                accumulatedCount: accumulatedSynced,
                accumulatedNewCount: accumulatedNew,
                responsesLimit: validation.responsesLimit,
              },
              onProgress,
            });

            return result;
          } catch (error) {
            console.error(
              `❌ Ошибка синхронизации страницы ${pageIndex} для вакансии ${vacancyId}:`,
              error,
            );

            await publish(
              syncArchivedResponsesChannel(vacancyId).progress({
                vacancyId,
                status: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Ошибка синхронизации",
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
        },
      );

      accumulatedSynced += pageResult.syncedResponses;
      accumulatedNew += pageResult.newResponses;
      hasMore = pageResult.hasMore;
      pageIndex++;
    }

    await step.run("update-last-synced", async () => {
      const publication = await db.query.vacancyPublication.findFirst({
        where: (pub, { and, eq }) =>
          and(eq(pub.vacancyId, vacancyId), eq(pub.platform, "HH")),
      });
      if (publication) {
        await db
          .update(vacancyPublication)
          .set({ lastSyncedAt: new Date() })
          .where(eq(vacancyPublication.id, publication.id));
      }
      return { success: true };
    });

    await step.run("parse-response-details", async () => {
      try {
        await publish(
          syncArchivedResponsesChannel(vacancyId).progress({
            vacancyId,
            status: "processing",
            message: "Парсинг деталей резюме...",
          }),
        );

        await runHHParseResponseDetailsForVacancy(
          workspaceId,
          vacancyId,
          async (
            processed: number,
            total: number,
            currentName?: string,
          ) => {
            await publish(
              syncArchivedResponsesChannel(vacancyId).progress({
                vacancyId,
                status: "processing",
                message: `Парсинг деталей: ${processed}/${total}${currentName ? ` — ${currentName}` : ""}`,
              }),
            );
          },
        );

        return { success: true };
      } catch (error) {
        console.error(
          `❌ Ошибка парсинга деталей для вакансии ${vacancyId}:`,
          error,
        );
        throw error;
      }
    });

    const result = {
      success: true,
      vacancyId,
      syncedResponses: accumulatedSynced,
      newResponses: accumulatedNew,
      vacancyTitle: validation.vacancyTitle,
    };

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
