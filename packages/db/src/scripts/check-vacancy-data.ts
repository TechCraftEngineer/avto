import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { response, responseScreening, vacancy } from "../schema";

const vacancyId = process.argv[2] || "019bffe5-658d-750b-9432-3a996ba92948";

async function checkVacancyData() {
  console.log(`🔍 Проверка данных для вакансии ${vacancyId}\n`);

  // Получаем данные из таблицы вакансий
  const vac = await db
    .select({
      id: vacancy.id,
      title: vacancy.title,
      resumesInProgress: vacancy.resumesInProgress,
      suitableResumes: vacancy.suitableResumes,
    })
    .from(vacancy)
    .where(eq(vacancy.id, vacancyId))
    .limit(1);

  if (vac.length === 0) {
    console.error("❌ Вакансия не найдена");
    process.exit(1);
  }

  console.log("📊 Данные в таблице вакансий:");
  console.log(`   Название: ${vac[0]?.title}`);
  console.log(`   В работе: ${vac[0]?.resumesInProgress}`);
  console.log(`   Подходящие: ${vac[0]?.suitableResumes}\n`);

  // Подсчитываем реальные данные из откликов
  const counters = await db
    .select({
      total: count(),
      new: sql<number>`COUNT(*) FILTER (WHERE ${response.status} = 'NEW')`,
      inProgress: sql<number>`COUNT(*) FILTER (WHERE ${response.hrSelectionStatus} = 'IN_PROGRESS')`,
      suitable: sql<number>`COUNT(*) FILTER (WHERE ${responseScreening.recommendation} = 'HIGHLY_RECOMMENDED' OR ${responseScreening.recommendation} = 'RECOMMENDED')`,
    })
    .from(response)
    .leftJoin(responseScreening, eq(response.id, responseScreening.responseId))
    .where(
      and(eq(response.entityType, "vacancy"), eq(response.entityId, vacancyId)),
    );

  const stats = counters[0];

  console.log("📈 Реальные данные из таблицы откликов:");
  console.log(`   Всего откликов: ${stats?.total}`);
  console.log(`   Новые: ${stats?.new}`);
  console.log(`   В работе: ${stats?.inProgress}`);
  console.log(`   Подходящие: ${stats?.suitable}\n`);

  // Проверяем соответствие (responses/newResponses удалены — сравниваем только in_progress/suitable)
  const match =
    vac[0]?.resumesInProgress === Number(stats?.inProgress) &&
    vac[0]?.suitableResumes === Number(stats?.suitable);

  if (match) {
    console.log("✅ Данные совпадают!");
  } else {
    console.log("⚠️  Данные НЕ совпадают!");
  }

  // Показываем детали откликов
  console.log("\n📋 Детали откликов:");
  const responses = await db
    .select({
      id: response.id,
      candidateName: response.candidateName,
      status: response.status,
      hrSelectionStatus: response.hrSelectionStatus,
      recommendation: responseScreening.recommendation,
    })
    .from(response)
    .leftJoin(responseScreening, eq(response.id, responseScreening.responseId))
    .where(
      and(eq(response.entityType, "vacancy"), eq(response.entityId, vacancyId)),
    );

  for (const r of responses) {
    console.log(
      `   - ${r.candidateName || "Без имени"}: status=${r.status}, hr=${r.hrSelectionStatus || "нет"}, rec=${r.recommendation || "нет"}`,
    );
  }

  process.exit(0);
}

checkVacancyData();
