import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { parseArchivedVacancyResponses } from "../parsers/response/archived-response-parser";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";

interface RunHHArchivedVacancyParserOptions {
  workspaceId: string;
  vacancyId: string;
  externalId?: string | null;
  url?: string | null;
}

export async function runHHArchivedVacancyParser(
  options: RunHHArchivedVacancyParserOptions,
): Promise<{ syncedResponses: number; newResponses: number }> {
  const { workspaceId, vacancyId, externalId, url } = options;

  console.log("🚀 Запуск HH парсера для архивной вакансии");
  console.log(`   Workspace: ${workspaceId}`);
  console.log(`   Vacancy: ${vacancyId}`);
  console.log(`   External ID: ${externalId}`);
  console.log(`   URL: ${url}`);

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  const { browser, page } = await setupPageWithAuth(
    workspaceId,
    credentials.email,
    credentials.password,
  );

  try {

    // Парсим отклики для конкретной архивной вакансии
    const result = await parseArchivedVacancyResponses(
      page,
      vacancyId,
      externalId,
      url,
    );

    console.log("✅ Парсинг архивной вакансии завершен успешно");
    console.log(`   Синхронизировано откликов: ${result.syncedResponses}`);
    console.log(`   Новых откликов: ${result.newResponses}`);

    return result;
  } catch (error) {
    console.error("❌ Ошибка при парсинге архивной вакансии:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}