import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { response, vacancy } from "../schema";

/**
 * Скрипт для обновления счетчиков откликов в вакансиях
 *
 * Обновляет следующие поля:
 * - responses: общее количество откликов
 * - newResponses: количество откликов со статусом NEW
 * - resumesInProgress: количество откликов с hrSelectionStatus = IN_PROGRESS
 * - suitableResumes: количество откликов с recommendation = HIGHLY_RECOMMENDED или RECOMMENDED
 */

async function updateVacancyCounters() {
  console.log("🔄 Начинаем обновление счетчиков откликов в вакансиях...\n");

  try {
    // Получаем все вакансии
    const vacancies = await db
      .select({ id: vacancy.id, title: vacancy.title })
      .from(vacancy)
      .where(eq(vacancy.isActive, true));

    console.log(`📊 Найдено активных вакансий: ${vacancies.length}\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const vac of vacancies) {
      try {
        // Подсчитываем отклики для каждой вакансии
        const counters = await db
          .select({
            total: count(),
            new: sql<number>`COUNT(*) FILTER (WHERE ${response.status} = 'NEW')`,
            inProgress: sql<number>`COUNT(*) FILTER (WHERE ${response.hrSelectionStatus} = 'IN_PROGRESS')`,
            suitable: sql<number>`COUNT(*) FILTER (WHERE ${response.recommendation} = 'HIGHLY_RECOMMENDED' OR ${response.recommendation} = 'RECOMMENDED')`,
          })
          .from(response)
          .where(
            and(
              eq(response.entityType, "vacancy"),
              eq(response.entityId, vac.id),
            ),
          );

        const stats = counters[0];

        if (!stats) {
          console.log(`⚠️  Вакансия "${vac.title}" (${vac.id}): нет данных`);
          continue;
        }

        // Обновляем счетчики в вакансии
        await db
          .update(vacancy)
          .set({
            responses: Number(stats.total) || 0,
            newResponses: Number(stats.new) || 0,
            resumesInProgress: Number(stats.inProgress) || 0,
            suitableResumes: Number(stats.suitable) || 0,
            updatedAt: new Date(),
          })
          .where(eq(vacancy.id, vac.id));

        console.log(
          `✅ Вакансия "${vac.title}" (${vac.id}):\n` +
            `   Всего откликов: ${stats.total}\n` +
            `   Новые: ${stats.new}\n` +
            `   В работе: ${stats.inProgress}\n` +
            `   Подходящие: ${stats.suitable}\n`,
        );

        updatedCount++;
      } catch (error) {
        console.error(`❌ Ошибка при обновлении вакансии ${vac.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`✅ Обновлено вакансий: ${updatedCount}`);
    if (errorCount > 0) {
      console.log(`❌ Ошибок: ${errorCount}`);
    }
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Запускаем скрипт
updateVacancyCounters();
