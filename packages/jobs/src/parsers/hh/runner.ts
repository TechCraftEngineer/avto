import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import puppeteer from "puppeteer";
import { checkAndPerformLogin, loadCookies } from "./auth";
import { closeBrowserSafely } from "./browser-utils";
import { HH_CONFIG } from "./config";
import { parseResponses } from "./response-parser";
import {
  parseArchivedVacancies,
  parseSingleVacancy,
  parseVacancies,
} from "./vacancy-parser";

interface RunHHParserOptions {
  workspaceId: string;
  skipResponses?: boolean;
  includeArchived?: boolean;
}

interface ParserResult {
  imported: number;
  updated: number;
  failed: number;
}

export async function runHHParser(
  options: RunHHParserOptions,
): Promise<ParserResult> {
  const {
    workspaceId,
    skipResponses = false,
    includeArchived = false,
  } = options;

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
    const loggedIn = await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

    if (!loggedIn) {
      throw new Error("Не удалось войти в систему HeadHunter");
    }

    let totalImported = 0;
    let totalUpdated = 0;
    let totalFailed = 0;

    const vacanciesResult = await parseVacancies(page, workspaceId);
    totalImported += vacanciesResult.imported;
    totalUpdated += vacanciesResult.updated;
    totalFailed += vacanciesResult.failed;

    if (!skipResponses && vacanciesResult.vacancies.length > 0) {
      console.log("\n📨 Парсинг откликов активных вакансий...");

      for (const vacancy of vacanciesResult.vacancies) {
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
      const archivedResult = await parseArchivedVacancies(page, workspaceId);
      totalImported += archivedResult.imported;
      totalUpdated += archivedResult.updated;
      totalFailed += archivedResult.failed;

      if (!skipResponses && archivedResult.vacancies.length > 0) {
        console.log("\n📨 Парсинг откликов архивных вакансий...");

        for (const vacancy of archivedResult.vacancies) {
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
    console.log(
      `📊 Статистика: импортировано ${totalImported}, обновлено ${totalUpdated}, ошибок ${totalFailed}`,
    );

    return {
      imported: totalImported,
      updated: totalUpdated,
      failed: totalFailed,
    };
  } catch (error) {
    console.error("❌ Ошибка при парсинге:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * Импортирует одну вакансию по её externalId
 */
export async function importSingleVacancy(
  workspaceId: string,
  externalId: string,
): Promise<{ vacancyId: string; isNew: boolean }> {
  console.log(`🚀 Импорт вакансии ${externalId}`);

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
    const loggedIn = await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

    if (!loggedIn) {
      throw new Error("Не удалось войти в систему HeadHunter");
    }

    const result = await parseSingleVacancy(page, externalId, workspaceId);

    console.log(
      `✅ Вакансия ${result.isNew ? "импортирована" : "обновлена"}: ${result.vacancyId}`,
    );

    return result;
  } catch (error) {
    console.error("❌ Ошибка при импорте вакансии:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}
