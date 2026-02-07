import { db } from "@qbs-autonaim/db/client";
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";

/**
 * Скрипт для исправления отсутствующих записей в vacancy_publications
 * Находит все вакансии без публикаций и создаёт для них записи
 */
async function fixVacancyPublications() {
  console.log("🔍 Поиск вакансий без публикаций...");

  // Получаем все вакансии
  const allVacancies = await db.query.vacancy.findMany({
    with: {
      publications: true,
    },
  });

  console.log(`📊 Всего вакансий: ${allVacancies.length}`);

  // Фильтруем вакансии без публикаций
  const vacanciesWithoutPublications = allVacancies.filter(
    (v) => v.publications.length === 0,
  );

  console.log(
    `⚠️  Вакансий без публикаций: ${vacanciesWithoutPublications.length}`,
  );

  if (vacanciesWithoutPublications.length === 0) {
    console.log("✅ Все вакансии имеют публикации");
    return;
  }

  console.log("\n🔧 Создание публикаций...");

  let created = 0;
  let failed = 0;

  for (const v of vacanciesWithoutPublications) {
    try {
      await db.insert(vacancyPublication).values({
        vacancyId: v.id,
        platform: v.source,
        externalId: v.externalId || undefined,
        url: v.url || undefined,
        isActive: v.isActive ?? true,
      });

      created++;
      console.log(
        `✅ Создана публикация для вакансии: ${v.title} (${v.source})`,
      );
    } catch (error) {
      failed++;
      console.error(
        `❌ Ошибка создания публикации для вакансии ${v.title}:`,
        error,
      );
    }
  }

  console.log(`\n📈 Результаты:`);
  console.log(`   Создано: ${created}`);
  console.log(`   Ошибок: ${failed}`);
  console.log(`\n✅ Исправление завершено`);
}

// Запускаем скрипт
fixVacancyPublications()
  .then(() => {
    console.log("\n🎉 Скрипт выполнен успешно");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Ошибка выполнения скрипта:", error);
    process.exit(1);
  });
