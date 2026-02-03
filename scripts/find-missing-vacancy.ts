import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response, vacancy } from "@qbs-autonaim/db/schema";

/**
 * Скрипт для поиска информации об удаленной вакансии
 * и исправления entity_id в откликах
 */

const ORPHANED_ENTITY_ID = "019c1073-4afe-7627-8fb4-6d4d521c93b1";

async function findAndFixMissingVacancy() {
  console.log("🔍 Ищем информацию об удаленной вакансии...\n");

  // 1. Проверяем, есть ли вакансия с таким ID
  const deletedVacancy = await db.query.vacancy.findFirst({
    where: eq(vacancy.id, ORPHANED_ENTITY_ID),
  });

  if (deletedVacancy) {
    console.log("✅ Вакансия найдена в базе:");
    console.log(`  Название: ${deletedVacancy.title}`);
    console.log(`  External ID: ${deletedVacancy.externalId}`);
    console.log(`  Источник: ${deletedVacancy.source}`);
    return;
  }

  console.log("❌ Вакансия не найдена в базе\n");

  // 2. Получаем все текущие вакансии
  const allVacancies = await db.query.vacancy.findMany({
    with: {
      publications: true,
    },
  });

  console.log(`📊 Всего вакансий в базе: ${allVacancies.length}\n`);

  // 3. Получаем отклики с проблемным entity_id
  const orphanedResponses = await db.query.response.findMany({
    where: eq(response.entityId, ORPHANED_ENTITY_ID),
    columns: {
      id: true,
      candidateName: true,
      resumeId: true,
      createdAt: true,
    },
  });

  console.log(
    `📊 Откликов с несуществующим entity_id: ${orphanedResponses.length}\n`,
  );

  // 4. Пытаемся найти подходящую вакансию по externalId
  console.log(
    "🔍 Ищем вакансию 'Няня для двух девочек' (External ID: 128580152)...",
  );

  const targetVacancy = allVacancies.find(
    (v) => v.externalId === "128580152" && v.source === "HH",
  );

  if (targetVacancy) {
    console.log("\n✅ Найдена подходящая вакансия:");
    console.log(`  ID: ${targetVacancy.id}`);
    console.log(`  Название: ${targetVacancy.title}`);
    console.log(`  External ID: ${targetVacancy.externalId}`);
    console.log(`  Источник: ${targetVacancy.source}`);
    console.log(`  Workspace: ${targetVacancy.workspaceId}`);

    console.log(
      `\n📝 Для исправления нужно обновить entity_id с ${ORPHANED_ENTITY_ID} на ${targetVacancy.id}`,
    );
    console.log(`\n⚠️  Это затронет ${orphanedResponses.length} откликов`);

    // Предлагаем исправить
    console.log(
      "\n❓ Хотите исправить entity_id? (запустите скрипт с флагом --fix)",
    );
  } else {
    console.log("\n❌ Подходящая вакансия не найдена");
    console.log("\nВозможные причины:");
    console.log("  1. Вакансия была удалена");
    console.log("  2. External ID изменился");
    console.log("  3. Вакансия была объединена с другой");

    console.log("\n📋 Список всех вакансий:");
    allVacancies.forEach((v) => {
      console.log(`  - ${v.title}`);
      console.log(`    ID: ${v.id}`);
      console.log(`    External ID: ${v.externalId || "нет"}`);
      console.log(`    Источник: ${v.source}`);
      console.log("");
    });
  }
}

findAndFixMissingVacancy()
  .then(() => {
    console.log("\n🎉 Скрипт выполнен успешно");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Ошибка выполнения скрипта:", error);
    process.exit(1);
  });
