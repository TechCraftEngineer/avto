#!/usr/bin/env bun

import { db } from "@qbs-autonaim/db";
import {
  createDemoOrganization,
  createDemoUsers,
  loadChatMessages,
  loadChatSessions,
  loadGigResponses,
  loadGigs,
  loadInterviewMessages,
  loadInterviewSessions,
  loadPhotos,
  loadVacancies,
  loadVacancyResponses,
} from "./loaders";

async function loadAllDemoData() {
  console.log("🚀 Загрузка демо данных...");

  try {
    // 1. Создаем организацию и workspace
    await createDemoOrganization();

    // 2. Создаем демо пользователей
    const userIds = await createDemoUsers();

    // 3. Загружаем фото кандидатов
    const photoMapping = await loadPhotos();

    // 4. Загружаем вакансии
    const { insertedVacancies, vacancyMapping } = await loadVacancies();

    // 5. Загружаем задания (gigs)
    const { insertedGigs, gigMapping } = await loadGigs();

    // 6. Загружаем отклики на вакансии
    const vacancyResponses = await loadVacancyResponses(
      vacancyMapping,
      photoMapping,
      insertedVacancies[0]?.id || "",
    );

    // 7. Загружаем отклики на задания
    const gigResponses = await loadGigResponses(
      gigMapping,
      photoMapping,
      insertedGigs[0]?.id || "",
    );

    // 8. Создаем маппинг откликов для интервью
    const allResponses = await db.query.response.findMany({
      columns: { id: true, candidateId: true },
    });

    const responseMapping: Record<string, string> = {};
    for (const resp of allResponses) {
      responseMapping[resp.candidateId] = resp.id;
    }

    // 9. Загружаем интервью-сессии
    const { sessions: interviewSessions, sessionMapping } =
      await loadInterviewSessions(responseMapping, allResponses[0]?.id || "");

    // 10. Загружаем сообщения интервью
    const interviewMessages = await loadInterviewMessages(
      sessionMapping,
      interviewSessions[0]?.id || "",
    );

    // 11. Загружаем чат-сессии
    const vacancyIds = insertedVacancies.map((v) => v.id);
    const gigIds = insertedGigs.map((g) => g.id);

    const { sessions: chatSessions, sessionMapping: chatSessionMapping } =
      await loadChatSessions(userIds, vacancyIds, gigIds);

    // 12. Загружаем сообщения чатов
    const chatMessages = await loadChatMessages(
      userIds,
      chatSessionMapping,
      chatSessions[0]?.id || "",
    );

    // Итоговая статистика
    console.log("\n✨ Все демо данные успешно загружены!");
    console.log("📊 Итого:");
    console.log(`  - ${insertedVacancies.length} вакансий`);
    console.log(`  - ${insertedGigs.length} заданий`);
    console.log(
      `  - ${vacancyResponses.length + gigResponses.length} откликов`,
    );
    console.log(`  - ${Object.keys(photoMapping).length} фото`);
    console.log(`  - ${interviewSessions.length} интервью-сессий`);
    console.log(`  - ${interviewMessages.length} сообщений интервью`);
    console.log(`  - ${chatSessions.length} чат-сессий`);
    console.log(`  - ${chatMessages.length} сообщений чатов`);
  } catch (error) {
    console.error("❌ Ошибка при загрузке демо данных:", error);
    process.exit(1);
  }
}

loadAllDemoData();
