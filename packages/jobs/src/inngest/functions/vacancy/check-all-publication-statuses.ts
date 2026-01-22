import { db } from "@qbs-autonaim/db/client";
import { inngest } from "../../client";
import { checkPublicationStatusChannel } from "../../channels/client";

/**
 * Inngest функция для массовой проверки статуса всех публикаций вакансий
 * Запускает проверки для всех активных публикаций, которые давно не проверялись
 */
export const checkAllPublicationStatusesFunction = inngest.createFunction(
  {
    id: "check-all-publication-statuses",
    name: "Check All Publication Statuses",
    retries: 1,
    concurrency: 1, // Запускаем только один процесс массовой проверки
  },
  { event: "vacancy/publications.status.check-all" },
  async ({ event, step, publish }) => {
    const { workspaceId } = event.data;

    await publish(
      checkPublicationStatusChannel("bulk").status({
        status: "started",
        message: "Начинаем массовую проверку статусов публикаций",
        publicationId: "bulk",
      }),
    );

    const result = await step.run("check-all-publications", async () => {
      console.log(
        `🚀 Запуск массовой проверки статусов публикаций для workspace ${workspaceId}`,
      );

      // Получаем все активные публикации, которые не проверялись более 24 часов
      // или никогда не проверялись
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const publications = await db.query.vacancyPublication.findMany({
        where: (table, { eq, or, isNull, lt, and }) =>
          and(
            eq(table.isActive, true), // Только активные публикации
            or(
              isNull(table.lastCheckedAt), // Никогда не проверялись
              lt(table.lastCheckedAt, oneDayAgo), // Проверялись более 24 часов назад
            ),
          ),
        with: {
          vacancy: {
            columns: {
              workspaceId: true,
            },
          },
        },
      });

      // Фильтруем по workspaceId, если указан
      const filteredPublications = workspaceId
        ? publications.filter((pub) => pub.vacancy.workspaceId === workspaceId)
        : publications;

      console.log(
        `📊 Найдено ${filteredPublications.length} публикаций для проверки`,
      );

      if (filteredPublications.length === 0) {
        await publish(
          checkPublicationStatusChannel("bulk").status({
            status: "completed",
            message: "Нет публикаций, требующих проверки",
            publicationId: "bulk",
          }),
        );
        return {
          success: true,
          totalChecked: 0,
          message: "Нет публикаций для проверки",
        };
      }

      await publish(
        checkPublicationStatusChannel("bulk").status({
          status: "processing",
          message: `Проверяем статус ${filteredPublications.length} публикаций`,
          publicationId: "bulk",
        }),
      );

      // Запускаем последовательные проверки для каждой публикации
      const results = [];
      for (const publication of filteredPublications) {
        console.log(
          `🔍 Проверяем публикацию ${publication.id} на платформе ${publication.platform}`,
        );

        try {
          // Отправляем событие для проверки конкретной публикации с детерминистическим stepId
          const stepId = `check-publication-${publication.id}`;
          await step.sendEvent(stepId, {
            name: "vacancy/publication.status.check",
            data: { publicationId: publication.id },
          });

          results.push({ publicationId: publication.id, success: true });
        } catch (error) {
          console.error(
            `❌ Ошибка при отправке события проверки для публикации ${publication.id}:`,
            error,
          );
          results.push({
            publicationId: publication.id,
            success: false,
            error: String(error),
          });
        }
      }
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      const message = `Проверка завершена: ${successful} успешно, ${failed} ошибок`;

      await publish(
        checkPublicationStatusChannel("bulk").status({
          status: "completed",
          message,
          publicationId: "bulk",
          isActive: true, // Для bulk проверки всегда true, если были публикации для проверки
        }),
      );

      console.log(
        `✅ Массовая проверка завершена: ${successful}/${filteredPublications.length} успешно`,
      );

      return {
        success: failed === 0,
        totalChecked: filteredPublications.length,
        successful,
        failed,
        results,
      };
    });

    return result;
  },
);
