import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";

async function checkResponses() {
  console.log("Проверка откликов в базе данных...\n");

  // 1. Общее количество откликов
  const allResponses = await db.select().from(response);
  console.log(`Всего откликов: ${allResponses.length}`);

  // 2. Количество по типам
  const vacancyResponses = allResponses.filter(
    (r) => r.entityType === "vacancy",
  );
  const gigResponses = allResponses.filter((r) => r.entityType === "gig");
  console.log(`Откликов на вакансии: ${vacancyResponses.length}`);
  console.log(`Откликов на гиги: ${gigResponses.length}`);

  // 3. Первые 5 откликов на вакансии
  if (vacancyResponses.length > 0) {
    console.log("\nПервые 5 откликов на вакансии:");
    vacancyResponses.slice(0, 5).forEach((r, i) => {
      console.log(`${i + 1}. ID: ${r.id}`);
      console.log(`   Entity ID: ${r.entityId}`);
      console.log(`   Кандидат: ${r.candidateName || "Не указано"}`);
      console.log(`   Статус: ${r.status}`);
      console.log(`   Создан: ${r.createdAt}`);
      console.log("");
    });

    // 4. Группировка по вакансиям
    const byVacancy = vacancyResponses.reduce(
      (acc, r) => {
        const key = r.entityId;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
      },
      {} as Record<string, typeof vacancyResponses>,
    );

    console.log("\nОтклики по вакансиям:");
    Object.entries(byVacancy).forEach(([vacancyId, responses]) => {
      console.log(`Вакансия ${vacancyId}: ${responses.length} откликов`);
    });
  } else {
    console.log("\n⚠️ Откликов на вакансии не найдено!");
  }

  process.exit(0);
}

checkResponses().catch((error) => {
  console.error("Ошибка:", error);
  process.exit(1);
});
