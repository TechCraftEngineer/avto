import {
  getIntegrationCredentials,
  markIntegrationAuthError,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { validateCredentials } from "../core/auth/auth";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { HH_CONFIG } from "../core/config/config";

/**
 * Преобразует дату из формата "12.12.24" в ISO формат
 */
function parseArchivedDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") {
    return "";
  }

  const dateRegex = /^\d{1,2}\.\d{1,2}\.\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return "";
  }

  const parts = dateStr.split(".");
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];

  if (!day || !month || !year) {
    return "";
  }

  const paddedDay = day.padStart(2, "0");
  const paddedMonth = month.padStart(2, "0");
  const fullYear = `20${year}`;
  const date = new Date(`${fullYear}-${paddedMonth}-${paddedDay}`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
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
  if (!credentials) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  validateCredentials(credentials);

  const password = credentials.password || "";

  let browser;
  let page;

  try {
    const result = await setupPageWithAuth(
      workspaceId,
      credentials.email!,
      password,
    );
    browser = result.browser;
    page = result.page;
  } catch (error) {
    // Ошибка авторизации уже помечена в checkAndPerformLogin
    console.error("❌ Ошибка при настройке браузера с авторизацией:", error);
    throw error;
  }

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
