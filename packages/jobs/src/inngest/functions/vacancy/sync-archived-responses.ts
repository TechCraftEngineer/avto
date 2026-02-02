import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";
import { runHHArchivedVacancyParser } from "@qbs-autonaim/jobs-parsers";
import { syncArchivedResponsesChannel } from "../../channels/client";
import { inngest } from "../../client";

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
      syncArchivedResponsesChannel(vacancyId).status({
        status: "started",
        message: "Начинаем синхронизацию архивных откликов",
        vacancyId,
      }),
    );

    const result = await step.run("sync-archived-responses", async () => {
      console.log(
        `🚀 Запуск синхронизации архивных откликов для вакансии ${vacancyId}`,
      );

      // Получаем вакансию
      const vacancyData = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, vacancyId),
      });

      if (!vacancyData) {
        await publish(
          syncArchivedResponsesChannel(vacancyId).status({
            status: "error",
            message: `Вакансия ${vacancyId} не найдена`,
            vacancyId,
          }),
        );
        throw new Error(`Вакансия ${vacancyId} не найдена`);
      }

      // Проверяем, что вакансия принадлежит указанному рабочему пространству
      if (vacancyData.workspaceId !== workspaceId) {
        await publish(
          syncArchivedResponsesChannel(vacancyId).status({
            status: "error",
            message: `Вакансия ${vacancyId} не принадлежит рабочему пространству ${workspaceId}`,
            vacancyId,
          }),
        );
        throw new Error(
          `Вакансия ${vacancyId} не принадлежит рабочему пространству ${workspaceId}`,
        );
      }

      // Получаем публикацию на HH.ru
      const publication = await db.query.vacancyPublication.findFirst({
        where: (pub, { and, eq }) =>
          and(eq(pub.vacancyId, vacancyId), eq(pub.platform, "HH")),
      });

      if (!publication) {
        await publish(
          syncArchivedResponsesChannel(vacancyId).status({
            status: "error",
            message: "Вакансия не опубликована на HH.ru",
            vacancyId,
          }),
        );
        throw new Error("Вакансия не опубликована на HH.ru");
      }

      if (!publication.externalId && !publication.url) {
        await publish(
          syncArchivedResponsesChannel(vacancyId).status({
            status: "error",
            message: "У публикации нет externalId или URL для синхронизации",
            vacancyId,
          }),
        );
        throw new Error(
          "У публикации нет externalId или URL для синхронизации",
        );
      }

      try {
        await publish(
          syncArchivedResponsesChannel(vacancyId).status({
            status: "processing",
            message: "Получаем все отклики с HeadHunter (архивные)",
            vacancyId,
          }),
        );

        const { syncedResponses, newResponses } =
          await runHHArchivedVacancyParser({
            workspaceId,
            vacancyId,
            externalId: publication.externalId,
            url: publication.url,
          });

        // Обновляем lastSyncedAt для публикации
        await db
          .update(vacancyPublication)
          .set({
            lastSyncedAt: new Date(),
          })
          .where(eq(vacancyPublication.id, publication.id));

        await publish(
          syncArchivedResponsesChannel(vacancyId).status({
            status: "completed",
            message: `Синхронизация завершена. Обработано: ${syncedResponses}, новых: ${newResponses}`,
            vacancyId,
            syncedResponses,
            newResponses,
            vacancyTitle: vacancyData.title,
          }),
        );

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
          syncArchivedResponsesChannel(vacancyId).status({
            status: "error",
            message:
              error instanceof Error ? error.message : "Неизвестная ошибка",
            vacancyId,
          }),
        );
        throw error;
      }
    });

    // Запускаем сбор chat_id после получения откликов
    await step.run("trigger-chat-ids-collection", async () => {
      console.log(`🔄 Запускаем сбор chat_id для вакансии ${vacancyId}`);
      await inngest.send({
        name: "vacancy/chat-ids.collect",
        data: { vacancyId },
      });
      console.log(
        `✅ Событие сбора chat_id отправлено для вакансии ${vacancyId}`,
      );
    });

    return result;
  },
);
