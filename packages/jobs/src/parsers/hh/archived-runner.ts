import { db, getIntegrationCredentials } from "@qbs-autonaim/db";
import puppeteer from "puppeteer";
import { parseArchivedVacancyResponses } from "./archived-response-parser";
import { checkAndPerformLogin } from "./auth";
import { closeBrowserSafely } from "./browser-utils";
import { HH_CONFIG } from "./config";

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

  const browser = await puppeteer.launch(HH_CONFIG.puppeteer);

  try {
    const page = await browser.newPage();

    await page.setUserAgent(HH_CONFIG.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Check authentication and perform login if needed
    await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

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
