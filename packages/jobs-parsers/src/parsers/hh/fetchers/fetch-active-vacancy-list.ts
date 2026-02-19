import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { validateCredentials } from "../core/auth/auth";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { HH_CONFIG } from "../core/config/config";
import { humanDelay } from "../utils/human-behavior";

export async function fetchActiveVacanciesList(workspaceId: string): Promise<
  {
    url: string;
    externalId?: string;
    title?: string;
    region?: string;
  }[]
> {
  console.log("📋 Получение списка активных вакансий");

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  validateCredentials(credentials);

  const password = credentials.password || "";

  const { browser, page } = await setupPageWithAuth(
    workspaceId,
    credentials.email,
    password,
  );

  try {
    await page.goto(HH_CONFIG.urls.vacancies, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    await humanDelay(
      HH_CONFIG.delays.readingPage.min,
      HH_CONFIG.delays.readingPage.max,
    );


    await page.waitForSelector('div[data-qa~="vacancies-dashboard-manager"]', {
      timeout: HH_CONFIG.timeouts.selector,
    });

    const activeVacancies = await page.$$eval(
      'div[data-qa^="vacancy-active_"]',
      (elements) => {
        return elements.map((element) => {
          const dataQa = element.getAttribute("data-qa") || "";
          const externalId = dataQa.match(/vacancy-active_(\d+)/)?.[1];

          const linkElement = element.querySelector(
            'a[data-qa="vacancies-dashboard-vacancy-name"]',
          ) as HTMLAnchorElement;
          const title = linkElement?.textContent?.trim() || "";
          const url = linkElement?.href || "";

          const regionElement = element.querySelector(
            'div[data-qa="table-flexible-cell-area"]',
          );
          const region = regionElement?.textContent?.trim();

          return { title, url, region, externalId };
        });
      },
    );

    console.log(`✅ Найдено активных вакансий: ${activeVacancies.length}`);

    return activeVacancies.map((vacancy) => ({
      url: vacancy.url,
      externalId: vacancy.externalId,
      title: vacancy.title,
      region: vacancy.region,
    }));
  } finally {
    await closeBrowserSafely(browser);
  }
}
