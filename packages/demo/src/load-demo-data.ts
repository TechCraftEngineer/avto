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
    const { workspaceId } = await createDemoOrganization();

    // 2. Удаляем старые демо-данные для этого workspace
    console.log("\n🗑️  Очищаем старые демо-данные...");
    const {
      vacancy: vacancySchema,
      gig: gigSchema,
      response: responseSchema,
    } = await import("@qbs-autonaim/db/schema");
    const { and, eq, inArray } = await import("drizzle-orm");

    // Получаем ID вакансий и заданий для текущего workspace
    const vacancyIds = await db
      .select({ id: vacancySchema.id })
      .from(vacancySchema)
      .where(eq(vacancySchema.workspaceId, workspaceId));

    const gigIds = await db
      .select({ id: gigSchema.id })
      .from(gigSchema)
      .where(eq(gigSchema.workspaceId, workspaceId));

    // Удаляем отклики только для вакансий и заданий текущего workspace
    if (vacancyIds.length > 0) {
      await db.delete(responseSchema).where(
        and(
          eq(responseSchema.entityType, "vacancy"),
          inArray(
            responseSchema.entityId,
            vacancyIds.map((v) => v.id),
          ),
        ),
      );
    }

    if (gigIds.length > 0) {
      await db.delete(responseSchema).where(
        and(
          eq(responseSchema.entityType, "gig"),
          inArray(
            responseSchema.entityId,
            gigIds.map((g) => g.id),
          ),
        ),
      );
    }

    // Удаляем вакансии и задания
    await db
      .delete(vacancySchema)
      .where(eq(vacancySchema.workspaceId, workspaceId));
    await db.delete(gigSchema).where(eq(gigSchema.workspaceId, workspaceId));
    console.log("✅ Старые данные очищены");

    // 3. Создаем демо пользователей
    const userIds = await createDemoUsers();

    // 4. Загружаем фото кандидатов
    const photoMapping = await loadPhotos();

    // 5. Загружаем вакансии
    const { insertedVacancies, vacancyMapping } = await loadVacancies(
      userIds.recruiterId,
    );

    // 5. Загружаем задания (gigs)
    const { insertedGigs, gigMapping } = await loadGigs();

    // 7. Загружаем отклики на вакансии
    const vacancyResponses = await loadVacancyResponses(
      vacancyMapping,
      photoMapping,
      insertedVacancies[0]?.id || "",
    );

    // 8. Загружаем отклики на задания
    const gigResponses = await loadGigResponses(
      gigMapping,
      photoMapping,
      insertedGigs[0]?.id || "",
    );

    // 9. Создаем маппинг откликов для интервью
    const allResponses = await db.query.response.findMany({
      columns: { id: true, candidateId: true },
    });

    const responseMapping: Record<string, string> = {};
    for (const resp of allResponses) {
      responseMapping[resp.candidateId] = resp.id;
    }

    // 10. Загружаем интервью-сессии
    const { sessions: interviewSessions, sessionMapping } =
      await loadInterviewSessions(responseMapping, allResponses[0]?.id || "");

    // 11. Загружаем сообщения интервью
    const interviewMessages = await loadInterviewMessages(
      sessionMapping,
      interviewSessions[0]?.id || "",
    );

    // 12. Загружаем чат-сессии
    const insertedVacancyIds = insertedVacancies.map((v) => v.id);
    const insertedGigIds = insertedGigs.map((g) => g.id);

    const { sessions: chatSessions, sessionMapping: chatSessionMapping } =
      await loadChatSessions(userIds, insertedVacancyIds, insertedGigIds);

    // 13. Загружаем сообщения чатов
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
