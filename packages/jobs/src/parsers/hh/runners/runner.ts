import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { parseResponses } from "../parsers/response/response-parser";
import {
  parseArchivedVacancies,
  parseSingleVacancy,
  parseVacancies,
} from "../parsers/vacancy/vacancy-parser";

/**
 * Преобразует дату из формата "12.12.24" в ISO формат
 */
function parseArchivedDate(dateStr: string): string {
  const [day, month, year] = dateStr.split(".");
  // Предполагаем, что год в формате YY (24 = 2024)
  const fullYear = `20${year}`;
  return new Date(`${fullYear}-${month}-${day}`).toISOString();
}

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

  const { browser, page } = await setupPageWithAuth(
    workspaceId,
    credentials.email,
    credentials.password,
  );

  try {

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
        if (vacancy.responsesUrl && vacancy.externalId) {
          try {
            await parseResponses(
              page,
              vacancy.responsesUrl,
              vacancy.externalId,
              vacancy.id || "",
            );
          } catch (error) {
            console.error(`❌ Ошибка парсинга откликов вакансии ${vacancy.externalId}:`, error);
            totalFailed++;
          }
        }
      }
    }

    if (includeArchived) {
      console.log("\n📦 Парсинг архивных вакансий...");

      const archivedResult = await parseArchivedVacancies(page, workspaceId);
      totalImported += archivedResult.imported;
      totalUpdated += archivedResult.updated;
      totalFailed += archivedResult.failed;

      if (!skipResponses && archivedResult.vacancies.length > 0) {
        console.log("\n📨 Парсинг откликов архивных вакансий...");

        for (const vacancy of archivedResult.vacancies) {
          if (vacancy.responsesUrl && vacancy.externalId) {
            try {
              await parseResponses(
                page,
                vacancy.responsesUrl,
                vacancy.externalId,
                vacancy.id || "",
              );
            } catch (error) {
              console.error(`❌ Ошибка парсинга откликов архивной вакансии ${vacancy.externalId}:`, error);
              totalFailed++;
            }
          }
        }
      }
    }

    console.log("\n🎉 Парсинг завершен!");
    console.log(`   Импортировано: ${totalImported}`);
    console.log(`   Обновлено: ${totalUpdated}`);
    console.log(`   Ошибок: ${totalFailed}`);

    return {
      imported: totalImported,
      updated: totalUpdated,
      failed: totalFailed,
    };
  } finally {
    await closeBrowserSafely(browser);
  }
}

export async function fetchArchivedVacanciesList(
  workspaceId: string,
): Promise<{ url: string; date: string }[]> {
  console.log("📋 Получение списка архивных вакансий");

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

    await page.goto(HH_CONFIG.urls.archivedVacancies, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    await page.waitForSelector('[data-qa="vacancy-serp__vacancy"]', {
      timeout: HH_CONFIG.timeouts.selector,
    });

    const archivedVacancies = await page.$$eval(
      '[data-qa="vacancy-serp__vacancy"]',
      (elements) => {
        return elements.map((element) => {
          const titleElement = element.querySelector('[data-qa="vacancy-serp__vacancy-title"]');
          const title = titleElement?.textContent?.trim() || '';

          const urlElement = element.querySelector('[data-qa="vacancy-serp__vacancy-title"]') as HTMLAnchorElement;
          const url = urlElement?.href || '';

          const dateElement = element.querySelector('[data-qa="vacancy-serp__vacancy-date"]');
          const date = dateElement?.textContent?.trim() || '';

          return { title, url, date };
        });
      },
    );

    console.log(`✅ Найдено архивных вакансий: ${archivedVacancies.length}`);

    return archivedVacancies.map((vacancy) => ({
      url: vacancy.url,
      date: parseArchivedDate(vacancy.date),
    }));
  } finally {
    await closeBrowserSafely(browser);
  }
}

export async function importMultipleVacancies(
  workspaceId: string,
  vacancies: { url: string; date: string }[],
): Promise<{ imported: number; updated: number; failed: number }> {
  console.log(`📦 Импорт ${vacancies.length} архивных вакансий`);

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

    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const vacancy of vacancies) {
      try {
        console.log(`📄 Импорт вакансии: ${vacancy.url}`);
        const result = await parseSingleVacancy(page, vacancy.url, workspaceId);

        if (result.success) {
          imported++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`❌ Ошибка импорта вакансии ${vacancy.url}:`, error);
        failed++;
      }
    }

    console.log(`✅ Импорт завершен: ${imported} импортировано, ${failed} ошибок`);

    return { imported, updated, failed };
  } finally {
    await closeBrowserSafely(browser);
  }
}

export async function importSingleVacancy(
  workspaceId: string,
  url: string,
): Promise<{ success: boolean; vacancy?: any }> {
  console.log(`🔍 Импорт отдельной вакансии: ${url}`);

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

    const result = await parseSingleVacancy(page, url, workspaceId);

    return {
      success: result.success,
      vacancy: result.vacancy,
    };
  } finally {
    await closeBrowserSafely(browser);
  }
}