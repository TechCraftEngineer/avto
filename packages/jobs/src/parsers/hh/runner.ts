import { db, getIntegrationCredentials } from "@qbs-autonaim/db";
import puppeteer from "puppeteer";
import { checkAndPerformLogin, loadCookies } from "./auth";
import { closeBrowserSafely } from "./browser-utils";
import { HH_CONFIG } from "./config";
import { parseResponses } from "./response-parser";
import { parseVacancies, parseArchivedVacancies } from "./vacancy-parser";

interface RunHHParserOptions {
  workspaceId: string;
  skipResponses?: boolean;
  includeArchived?: boolean;
}

export async function runHHParser(options: RunHHParserOptions): Promise<void> {
  const { workspaceId, skipResponses = false, includeArchived = false } = options;

  console.log("🚀 Запуск HH парсера");
  console.log(`   Workspace: ${workspaceId}`);
  console.log(`   Пропустить отклики: ${skipResponses}`);
  console.log(`   Включить архивные вакансии: ${includeArchived}`);

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  const browser = await puppeteer.launch(HH_CONFIG.puppeteer);

  try {
    const page = await browser.newPage();

    await page.setUserAgent(HH_CONFIG.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Load existing cookies if available
    const savedCookies = await loadCookies("hh", workspaceId);
    if (savedCookies && savedCookies.length > 0) {
      await page.setCookie(...savedCookies);
    }

    // Check authentication and perform login if needed
    await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

    const vacancies = await parseVacancies(page, workspaceId);

    if (!skipResponses && vacancies.length > 0) {
      console.log("\n📨 Парсинг откликов активных вакансий...");

      for (const vacancy of vacancies) {
        if (vacancy.responsesUrl) {
          try {
            await parseResponses(page, vacancy.responsesUrl, vacancy.id);
          } catch (error) {
            console.error(
              `❌ Ошибка парсинга откликов для ${vacancy.title}:`,
              error,
            );
          }
        }
      }
    }

    // Парсинг архивных вакансий, если запрошено
    if (includeArchived) {
      console.log("\n📁 Парсинг архивных вакансий...");
      const archivedVacancies = await parseArchivedVacancies(page, workspaceId);

      if (!skipResponses && archivedVacancies.length > 0) {
        console.log("\n📨 Парсинг откликов архивных вакансий...");

        for (const vacancy of archivedVacancies) {
          if (vacancy.responsesUrl) {
            try {
              await parseResponses(page, vacancy.responsesUrl, vacancy.id);
            } catch (error) {
              console.error(
                `❌ Ошибка парсинга откликов для архивной вакансии ${vacancy.title}:`,
                error,
              );
            }
          }
        }
      }
    }

    console.log("✅ Парсинг завершен успешно");
  } catch (error) {
    console.error("❌ Ошибка при парсинге:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}
