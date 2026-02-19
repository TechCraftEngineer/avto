import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { uploadToTermbin } from "../../../utils/termbin";
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
    // Сохраняем верстку страницы с активными вакансиями на termbin для отладки
    try {
      const pageContent = await page.content();
      console.log(
        "📋 Загрузка верстки на termbin...",
        `(размер: ${(pageContent.length / 1024).toFixed(1)} KB)`,
      );
      const termbinUrl = await uploadToTermbin(pageContent);
      if (termbinUrl) {
        console.log(
          `📋 Верстка страницы с активными вакансиями сохранена: ${termbinUrl}`,
        );
      } else {
        console.warn(
          "📋 termbin вернул пустой ответ — верстка не сохранена",
        );
      }
    } catch (termbinError) {
      console.warn(
        "⚠️ Не удалось сохранить верстку на termbin:",
        termbinError instanceof Error ? termbinError.message : termbinError,
      );
    }

    // await page.waitForSelector('div[class="vacancy-dashboard-active"]', {
    //   timeout: HH_CONFIG.timeouts.selector,
    // });

    // const activeVacancies = await page.$$eval(
    //   'div[data-qa^="vacancy-active_"]',
    //   (elements) => {
    //     return elements.map((element) => {
    //       const dataQa = element.getAttribute("data-qa") || "";
    //       const externalId = dataQa.match(/vacancy-active_(\d+)/)?.[1];

    //       const titleElement = element.querySelector(
    //         'span[data-qa^="vacancies-dashboard-vacancy--active-name_"][data-qa$="-text"]',
    //       );
    //       const title = titleElement?.textContent?.trim() || "";

    //       const urlElement = element.querySelector(
    //         'a[data-qa^="vacancies-dashboard-vacancy--active-name_"]',
    //       ) as HTMLAnchorElement;
    //       const url = urlElement?.href || "";

    //       const regionElement = element.querySelector(
    //         'div[data-qa="table-flexible-cell-activeVacancyArea"]',
    //       );
    //       const region = regionElement?.textContent?.trim();

    //       const viewsElement = element.querySelector(
    //         'div[data-qa="table-flexible-cell-activeVacancyViews"]',
    //       );
    //       const views = viewsElement?.textContent?.trim();

    //       const responsesElement = element.querySelector(
    //         'div[data-qa="table-flexible-cell-activeVacancyResponses"]',
    //       );
    //       const responses = responsesElement?.textContent?.trim();

    //       return { title, url, region, externalId, views, responses };
    //     });
    //   },
    // );

    // console.log(`✅ Найдено активных вакансий: ${activeVacancies.length}`);

    // return activeVacancies.map((vacancy) => ({
    //   url: vacancy.url,
    //   externalId: vacancy.externalId,
    //   title: vacancy.title,
    //   region: vacancy.region,
    //   views: vacancy.views,
    //   responses: vacancy.responses,
    // }));
    return [];
  } finally {
    await closeBrowserSafely(browser);
  }
}
