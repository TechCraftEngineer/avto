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
    views?: string;
    responses?: string;
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
    credentials.email!,
    password,
  );

  const vacancies: Array<{
    url: string;
    externalId?: string;
    title?: string;
    region?: string;
    views?: string;
    responses?: string;
  }> = [];

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

    await page.waitForSelector('[data-qa="vacancy-serp__vacancy"]', {
      timeout: HH_CONFIG.timeouts.selector,
    });

    let hasNextPage = true;
    let pageNum = 0;

    while (hasNextPage && pageNum < 50) {
      console.log(
        `📄 Парсим страницу ${pageNum + 1} активных вакансий...`,
      );

      const pageVacancies = await page.$$eval(
        '[data-qa="vacancy-serp__vacancy"]',
        (elements) => {
          return elements.map((element) => {
            const titleElement = element.querySelector(
              '[data-qa="vacancy-serp__vacancy-title"]',
            );
            const title = titleElement?.textContent?.trim() || "";

            const urlElement = element.querySelector(
              '[data-qa="vacancy-serp__vacancy-title"]',
            ) as HTMLAnchorElement;
            const url = urlElement?.href || "";

            const locationElement = element.querySelector(
              '[data-qa="vacancy-serp__vacancy-address"]',
            );
            const region = locationElement?.textContent?.trim();

            const idMatch = url.match(/\/vacancy\/(\d+)/);
            const externalId = idMatch?.[1];

            const viewsElement = element.querySelector(
              '[data-qa="vacancy-serp__vacancy-views"]',
            );
            const views = viewsElement?.textContent?.trim();

            const responsesElement = element.querySelector(
              '[data-qa="vacancy-serp__vacancy-response-count"]',
            );
            const responses = responsesElement?.textContent?.trim();

            return { title, url, region, externalId, views, responses };
          });
        },
      );

      vacancies.push(
        ...pageVacancies.map((v) => ({
          url: v.url,
          externalId: v.externalId,
          title: v.title,
          region: v.region,
          views: v.views,
          responses: v.responses,
        })),
      );

      console.log(
        `📋 Найдено вакансий на странице ${pageNum + 1}: ${pageVacancies.length}`,
      );

      const nextButton = await page.$('[data-qa="pager-next"]');
      if (nextButton) {
        await humanDelay(
          HH_CONFIG.delays.scrollDelay.min,
          HH_CONFIG.delays.scrollDelay.max,
        );
        await nextButton.click();
        await page.waitForNetworkIdle({
          timeout: HH_CONFIG.timeouts.networkIdle,
        });
        await humanDelay(
          HH_CONFIG.delays.readingPage.min,
          HH_CONFIG.delays.readingPage.max,
        );
        pageNum++;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`✅ Найдено активных вакансий: ${vacancies.length}`);
  } finally {
    await closeBrowserSafely(browser);
  }

  return vacancies;
}
