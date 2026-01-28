import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { response, vacancy } from "../schema";

/**
 * Скрипт для обновления счетчиков откликов конкретной вакансии
 *
 * Использование: bun run update-counter <vacancy-id>
 */

const vacancyId = process.argv[2];

if (!vacancyId) {
  console.error("❌ Укажите ID вакансии");
  console.log("Использование: bun run update-counter <vacancy-id>");
  process.exit(1);
}

async function updateVacancyCounter(id: string) {
  console.log(`🔄 Обновление счетчиков для вакансии ${id}...\n`);

  try {
    // Проверяем существование вакансии
    const vac = await db
      .select({ id: vacancy.id, title: vacancy.title })
      .from(vacancy)
      .where(eq(vacancy.id, id))
      .limit(1);

    if (vac.length === 0) {
      console.error(`❌ Вакансия с ID ${id} не найдена`);
      process.exit(1);
    }

    // Подсчитываем отклики
    const counters = await db
      .select({
        total: count(),
        new: sql<number>`COUNT(*) FILTER (WHERE ${response.status} = 'NEW')`,
        inProgress: sql<number>`COUNT(*) FILTER (WHERE ${response.hrSelectionStatus} = 'IN_PROGRESS')`,
        suitable: sql<number>`COUNT(*) FILTER (WHERE ${response.recommendation} = 'HIGHLY_RECOMMENDED' OR ${response.recommendation} = 'RECOMMENDED')`,
      })
      .from(response)
      .where(
        and(eq(response.entityType, "vacancy"), eq(response.entityId, id)),
      );

    const stats = counters[0];

    if (!stats) {
      console.error("❌ Не удалось получить статистику откликов");
      process.exit(1);
    }

    // Обновляем счетчики
    const result = await db
      .update(vacancy)
      .set({
        responses: Number(stats.total) || 0,
        newResponses: Number(stats.new) || 0,
        resumesInProgress: Number(stats.inProgress) || 0,
        suitableResumes: Number(stats.suitable) || 0,
        updatedAt: new Date(),
      })
      .where(eq(vacancy.id, id))
      .returning({
        id: vacancy.id,
        title: vacancy.title,
        responses: vacancy.responses,
        newResponses: vacancy.newResponses,
        resumesInProgress: vacancy.resumesInProgress,
        suitableResumes: vacancy.suitableResumes,
      });

    if (result.length === 0) {
      console.error("❌ Не удалось обновить вакансию");
      process.exit(1);
    }

    const updated = result[0];

    console.log("✅ Счетчики успешно обновлены:");
    console.log(`   Вакансия: ${updated?.title}`);
    console.log(`   ID: ${updated?.id}`);
    console.log(`   Всего откликов: ${updated?.responses}`);
    console.log(`   Новые: ${updated?.newResponses}`);
    console.log(`   В работе: ${updated?.resumesInProgress}`);
    console.log(`   Подходящие: ${updated?.suitableResumes}`);
  } catch (error) {
    console.error("❌ Ошибка при обновлении счетчиков:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

updateVacancyCounter(vacancyId);
