import { inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { extractContactsFromResponses } from "~/services/response";
import { parseMissingContactsChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для парсинга контактов откликов без telegram username или телефона
 */
export const parseMissingContactsFunction = inngest.createFunction(
  {
    id: "parse-missing-contacts",
    name: "Parse Missing Contacts",
    batchEvents: {
      maxSize: 4,
      timeout: "10s",
    },
  },
  { event: "response/contacts.parse-missing" },
  async ({ events, step, publish }) => {
    console.log(`🚀 Запуск парсинга контактов для ${events.length} событий`);

    const vacancyIds = events.map((evt) => evt.data.vacancyId);
    console.log(`📋 Вакансии для обработки: ${vacancyIds.join(", ")}`);

    // Отправляем уведомление о начале для каждой вакансии
    for (const vacancyId of vacancyIds) {
      await publish(
        parseMissingContactsChannel(vacancyId).progress({
          vacancyId,
          status: "started",
          message: "Начинаем парсинг контактов",
          total: 0,
          processed: 0,
        }),
      );
    }

    // Получаем отклики без telegram username или телефона
    const responses = await step.run(
      "fetch-responses-without-contacts",
      async () => {
        const allResponses = await db.query.response.findMany({
          where: inArray(response.entityId, vacancyIds),
          columns: {
            id: true,
            entityId: true,
            resumeId: true,
            resumeUrl: true,
            candidateName: true,
            telegramUsername: true,
            phone: true,
            contacts: true,
          },
        });

        // Фильтруем только отклики с полем contacts, но без telegram username или телефона
        const results = allResponses.filter(
          (r) =>
            r.contacts &&
            (!r.telegramUsername ||
              r.telegramUsername === "" ||
              !r.phone ||
              r.phone === ""),
        );

        console.log(`✅ Найдено откликов без контактов: ${results.length}`);

        // Отправляем прогресс для каждой вакансии
        for (const vacancyId of vacancyIds) {
          const vacancyResponses = results.filter(
            (r) => r.entityId === vacancyId,
          );
          await publish(
            parseMissingContactsChannel(vacancyId).progress({
              vacancyId,
              status: "processing",
              message: `Найдено ${vacancyResponses.length} откликов для парсинга контактов`,
              total: vacancyResponses.length,
              processed: 0,
            }),
          );
        }

        return results;
      },
    );

    if (responses.length === 0) {
      console.log("ℹ️ Нет откликов для парсинга контактов");
      for (const vacancyId of vacancyIds) {
        await publish(
          parseMissingContactsChannel(vacancyId).result({
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

    // Извлекаем контакты из поля contacts
    const results = await step.run("extract-contacts", async () => {
      const responseIds = responses.map((r) => r.id);
      const result = await extractContactsFromResponses(responseIds);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    });

    // Отправляем финальный результат для каждой вакансии
    for (const vacancyId of vacancyIds) {
      const vacancyResponses = responses.filter(
        (r) => r.entityId === vacancyId,
      );
      await publish(
        parseMissingContactsChannel(vacancyId).result({
          vacancyId,
          success: true,
          total: vacancyResponses.length,
          processed: vacancyResponses.length,
          failed: 0,
        }),
      );
    }

    return {
      success: true,
      total: results.total,
      processed: results.processed,
      failed: results.failed,
    };
  },
);
