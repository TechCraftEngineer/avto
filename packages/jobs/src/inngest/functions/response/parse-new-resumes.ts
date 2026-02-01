import { inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { enrichHHResponses } from "@qbs-autonaim/jobs-parsers";
import { parseNewResumesChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для парсинга резюме новых откликов (без детальной информации)
 */
export const parseNewResumesFunction = inngest.createFunction(
  {
    id: "parse-new-resumes",
    name: "Parse New Resumes",
    batchEvents: {
      maxSize: 4,
      timeout: "10s",
    },
  },
  { event: "response/resume.parse-new" },
  async ({ events, step, publish }) => {
    console.log(`🚀 Запуск парсинга резюме для ${events.length} событий`);

    const vacancyIds = events.map((evt) => evt.data.vacancyId);
    console.log(`📋 Вакансии для обработки: ${vacancyIds.join(", ")}`);

    // Отправляем уведомление о начале для каждой вакансии
    for (const vacancyId of vacancyIds) {
      await publish(
        parseNewResumesChannel(vacancyId).progress({
          vacancyId,
          status: "started",
          message: "Начинаем парсинг резюме",
          total: 0,
          processed: 0,
        }),
      );
    }

    // Получаем отклики без детальной информации
    const responses = await step.run(
      "fetch-responses-without-details",
      async () => {
        const allResponses = await db.query.response.findMany({
          where: inArray(response.entityId, vacancyIds),
          columns: {
            id: true,
            entityId: true,
            resumeId: true,
            resumeUrl: true,
            candidateName: true,
            experience: true,
            contacts: true,
          },
        });

        // Фильтруем только отклики без детальной информации
        const results = allResponses.filter(
          (r) => !r.experience || r.experience === "",
        );

        console.log(`✅ Найдено откликов без деталей: ${results.length}`);

        // Отправляем прогресс для каждой вакансии
        for (const vacancyId of vacancyIds) {
          const vacancyResponses = results.filter(
            (r) => r.entityId === vacancyId,
          );
          await publish(
            parseNewResumesChannel(vacancyId).progress({
              vacancyId,
              status: "processing",
              message: `Найдено ${vacancyResponses.length} резюме для парсинга`,
              total: vacancyResponses.length,
              processed: 0,
            }),
          );
        }

        return results;
      },
    );

    if (responses.length === 0) {
      console.log("ℹ️ Нет откликов для парсинга");
      for (const vacancyId of vacancyIds) {
        await publish(
          parseNewResumesChannel(vacancyId).result({
            vacancyId,
            success: true,
            total: 0,
            processed: 0,
            failed: 0,
          }),
        );
      }
      return {
        success: true,
        total: 0,
        processed: 0,
        failed: 0,
      };
    }

    // Запускаем enricher для парсинга резюме
    await step.run("enrich-resumes", async () => {
      // Получаем workspaceId через vacancy
      if (responses.length === 0) {
        throw new Error("Нет откликов для обработки");
      }

      const firstResponse = responses[0];
      if (!firstResponse) {
        throw new Error("Не удалось получить первый отклик");
      }

      const vacancy = await db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, firstResponse.entityId),
      });

      if (!vacancy?.workspaceId) {
        throw new Error("workspaceId не найден");
      }

      await enrichHHResponses(vacancy.workspaceId);

      // Отправляем финальный статус для каждой вакансии
      for (const vacancyId of vacancyIds) {
        const vacancyResponses = responses.filter(
          (r) => r.entityId === vacancyId,
        );
        await publish(
          parseNewResumesChannel(vacancyId).result({
            vacancyId,
            success: true,
            total: vacancyResponses.length,
            processed: vacancyResponses.length,
            failed: 0,
          }),
        );
      }
    });

    return {
      success: true,
      total: responses.length,
      processed: responses.length,
      failed: 0,
    };
  },
);
