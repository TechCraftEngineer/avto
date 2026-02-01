import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { VacancyData } from "~/parsers/types";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { HH_CONFIG } from "../core/config/config";
import { parseArchivedVacancyResponses } from "../parsers/response/archived-response-parser";
import { parseSingleVacancy } from "../parsers/vacancy/vacancy-parser";

/**
 * Преобразует дату из формата "12.12.24" в ISO формат
 */
function parseArchivedDate(dateStr: string): string {
  const [day, month, year] = dateStr.split(".");
  // Предполагаем, что год в формате YY (24 = 2024)
  const fullYear = `20${year}`;
  return new Date(`${fullYear}-${month}-${day}`).toISOString();
}

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

export async function fetchArchivedVacanciesList(workspaceId: string): Promise<
  {
    url: string;
    date: string;
    externalId?: string;
    title?: string;
    region?: string;
    workLocation?: string;
    archivedAt?: string;
  }[]
> {
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

    await page.waitForSelector('div[class="vacancy-dashboard-archive"]', {
      timeout: HH_CONFIG.timeouts.selector,
    });

    const archivedVacancies = await page.$$eval(
      'div[data-qa^="vacancy-archive_"]',
      (elements) => {
        return elements.map((element) => {
          // Извлекаем externalId из data-qa атрибута (например, "vacancy-archive_128580152")
          const dataQa = element.getAttribute("data-qa") || "";
          const externalId = dataQa.match(/vacancy-archive_(\d+)/)?.[1];

          const titleElement = element.querySelector(
            'span[data-qa^="vacancies-dashboard-vacancy--archive-name_"][data-qa$="-text"]',
          );
          const title = titleElement?.textContent?.trim() || "";

          const urlElement = element.querySelector(
            'a[data-qa^="vacancies-dashboard-vacancy--archive-name_"]',
          ) as HTMLAnchorElement;
          const url = urlElement?.href || "";

          const dateElement = element.querySelector(
            'div[data-qa="table-flexible-cell-archiveVacancyArchivationTime"]',
          );
          const date = dateElement?.textContent?.trim() || "";

          const regionElement = element.querySelector(
            'div[data-qa="table-flexible-cell-archiveVacancyArea"]',
          );
          const region = regionElement?.textContent?.trim();

          return { title, url, date, region, externalId };
        });
      },
    );

    console.log(`✅ Найдено архивных вакансий: ${archivedVacancies.length}`);

    return archivedVacancies.map((vacancy) => ({
      url: vacancy.url,
      date: parseArchivedDate(vacancy.date),
      externalId: vacancy.externalId,
      title: vacancy.title,
      region: vacancy.region,
      archivedAt: parseArchivedDate(vacancy.date),
    }));
  } finally {
    await closeBrowserSafely(browser);
  }
}

export async function importMultipleVacancies(
  workspaceId: string,
  vacancies: { url: string; date: string }[],
  onProgress?: (
    index: number,
    success: boolean,
    error?: string,
  ) => Promise<void>,
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
    const updated = 0;
    let failed = 0;

    for (let i = 0; i < vacancies.length; i++) {
      const vacancy = vacancies[i];
      if (!vacancy) continue;

      try {
        console.log(
          `📄 Импорт вакансии ${i + 1}/${vacancies.length}: ${vacancy.url}`,
        );
        const result = await parseSingleVacancy(page, vacancy.url, workspaceId);

        if (result.success) {
          imported++;
          await onProgress?.(i, true);
        } else {
          failed++;
          await onProgress?.(i, false, "Не удалось импортировать вакансию");
        }
      } catch (error) {
        console.error(`❌ Ошибка импорта вакансии ${vacancy.url}:`, error);
        failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Неизвестная ошибка";
        await onProgress?.(i, false, errorMessage);
      }
    }

    console.log(
      `✅ Импорт завершен: ${imported} импортировано, ${failed} ошибок`,
    );

    return { imported, updated, failed };
  } finally {
    await closeBrowserSafely(browser);
  }
}

export async function importSingleVacancy(
  workspaceId: string,
  url: string,
): Promise<{ success: boolean; vacancy?: VacancyData }> {
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
      vacancy: result.vacancy || undefined,
    };
  } finally {
    await closeBrowserSafely(browser);
  }
}
