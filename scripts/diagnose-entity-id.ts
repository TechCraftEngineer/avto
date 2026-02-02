import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response, vacancy } from "@qbs-autonaim/db/schema";

/**
 * Скрипт для диагностики проблем с entity_id в таблице responses
 * Проверяет:
 * 1. Отклики с несуществующими entity_id
 * 2. Отклики с entity_id, не соответствующими вакансиям
 * 3. Статистику по источникам откликов
 */

async function diagnoseEntityIds() {
  console.log("🔍 Начинаем диагностику entity_id в таблице responses...\n");

  // 1. Получаем все отклики
  const allResponses = await db.query.response.findMany({
    where: eq(response.entityType, "vacancy"),
    columns: {
      id: true,
      entityId: true,
      candidateName: true,
      importSource: true,
      createdAt: true,
    },
  });

  console.log(
    `📊 Всего откликов с entityType='vacancy': ${allResponses.length}\n`,
  );

  // 2. Получаем все вакансии
  const allVacancies = await db.query.vacancy.findMany({
    columns: {
      id: true,
      title: true,
      externalId: true,
      source: true,
    },
  });

  const vacancyIds = new Set(allVacancies.map((v) => v.id));
  console.log(`📊 Всего вакансий в базе: ${allVacancies.length}\n`);

  // 3. Проверяем отклики с несуществующими entity_id
  const orphanedResponses = allResponses.filter(
    (r) => !vacancyIds.has(r.entityId),
  );

  if (orphanedResponses.length > 0) {
    console.log(
      `❌ Найдено откликов с несуществующими entity_id: ${orphanedResponses.length}`,
    );
    console.log("\nПримеры:");
    orphanedResponses.slice(0, 5).forEach((r) => {
      console.log(`  - ID: ${r.id}`);
      console.log(`    Кандидат: ${r.candidateName}`);
      console.log(`    entity_id: ${r.entityId}`);
      console.log(`    Источник: ${r.importSource}`);
      console.log(`    Создан: ${r.createdAt}`);
      console.log("");
    });
  } else {
    console.log("✅ Все отклики имеют корректные entity_id\n");
  }

  // 4. Статистика по источникам
  const sourceStats = allResponses.reduce(
    (acc, r) => {
      const source = r.importSource || "UNKNOWN";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("📈 Статистика по источникам импорта:");
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });
  console.log("");

  // 5. Проверяем отклики по вакансиям
  const responsesByVacancy = allResponses.reduce(
    (acc, r) => {
      if (!acc[r.entityId]) {
        acc[r.entityId] = [];
      }
      acc[r.entityId].push(r);
      return acc;
    },
    {} as Record<string, typeof allResponses>,
  );

  console.log("📊 Топ-10 вакансий по количеству откликов:");
  Object.entries(responsesByVacancy)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10)
    .forEach(([vacancyId, responses]) => {
      const vacancy = allVacancies.find((v) => v.id === vacancyId);
      console.log(
        `  ${vacancy?.title || "Неизвестная вакансия"} (${vacancyId}): ${responses.length} откликов`,
      );
    });
  console.log("");

  // 6. Проверяем вакансии без откликов
  const vacanciesWithoutResponses = allVacancies.filter(
    (v) => !responsesByVacancy[v.id],
  );

  console.log(`📊 Вакансий без откликов: ${vacanciesWithoutResponses.length}`);
  if (vacanciesWithoutResponses.length > 0) {
    console.log("\nПримеры:");
    vacanciesWithoutResponses.slice(0, 5).forEach((v) => {
      console.log(`  - ${v.title} (${v.id})`);
      console.log(`    Источник: ${v.source}`);
      console.log(`    External ID: ${v.externalId || "нет"}`);
      console.log("");
    });
  }

  console.log("\n✅ Диагностика завершена");
}

diagnoseEntityIds()
  .then(() => {
    console.log("\n🎉 Скрипт выполнен успешно");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Ошибка выполнения скрипта:", error);
    process.exit(1);
  });
