import type { Page } from "puppeteer";
import type { VacancyData } from "../../types";
import { HH_CONFIG } from "../../core/config/config";
import { humanDelay } from "../../utils/human-behavior";

/**
 * Общая функция для сбора вакансий с указанного URL
 */
export async function collectVacanciesFromUrl(
  page: Page,
  url: string,
  vacancyType: 'active' | 'archived'
): Promise<VacancyData[]> {
  const vacancies: VacancyData[] = [];

  try {
    // Переходим на указанную страницу
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    await humanDelay(HH_CONFIG.delays.readingPage.min, HH_CONFIG.delays.readingPage.max);

    // Ждем загрузки вакансий
    await page.waitForSelector('[data-qa="vacancy-serp__vacancy"]', {
      timeout: HH_CONFIG.timeouts.selector,
    });

    // Собираем все вакансии на всех страницах
    let hasNextPage = true;
    let pageNum = 0;

    while (hasNextPage && pageNum < 50) { // Ограничение на 50 страниц для безопасности
      console.log(`📄 Парсим страницу ${pageNum + 1} ${vacancyType === 'active' ? 'активных' : 'архивных'} вакансий...`);

      // Собираем вакансии с текущей страницы
      const pageVacancies = await page.$$eval('[data-qa="vacancy-serp__vacancy"]', (elements) => {
        return elements.map((element) => {
          const titleElement = element.querySelector('[data-qa="vacancy-serp__vacancy-title"]');
          const title = titleElement?.textContent?.trim() || '';

          const urlElement = element.querySelector('[data-qa="vacancy-serp__vacancy-title"]') as HTMLAnchorElement;
          const url = urlElement?.href || '';

          const companyElement = element.querySelector('[data-qa="vacancy-serp__vacancy-employer"]');
          const company = companyElement?.textContent?.trim() || '';

          const salaryElement = element.querySelector('[data-qa="vacancy-serp__vacancy-compensation"]');
          const salary = salaryElement?.textContent?.trim() || '';

          const locationElement = element.querySelector('[data-qa="vacancy-serp__vacancy-address"]');
          const location = locationElement?.textContent?.trim() || '';

          const dateElement = element.querySelector('[data-qa="vacancy-serp__vacancy-date"]');
          const date = dateElement?.textContent?.trim() || '';

          const idMatch = url.match(/\/vacancy\/(\d+)/);
          const externalId = idMatch ? idMatch[1] : '';

          return {
            title,
            url,
            company,
            salary,
            location,
            date,
            externalId,
            status: vacancyType as 'active' | 'archived',
          };
        });
      });

      vacancies.push(...pageVacancies);
      console.log(`📋 Найдено вакансий на странице ${pageNum + 1}: ${pageVacancies.length}`);

      // Проверяем, есть ли следующая страница
      const nextButton = await page.$('[data-qa="pager-next"]');
      if (nextButton) {
        await humanDelay(HH_CONFIG.delays.scrollDelay.min, HH_CONFIG.delays.scrollDelay.max);
        await nextButton.click();
        await page.waitForNetworkIdle({
          timeout: HH_CONFIG.timeouts.networkIdle,
        });
        await humanDelay(HH_CONFIG.delays.readingPage.min, HH_CONFIG.delays.readingPage.max);
        pageNum++;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`📊 Всего собрано ${vacancyType === 'active' ? 'активных' : 'архивных'} вакансий: ${vacancies.length}`);
  } catch (error) {
    console.error(`❌ Ошибка при сборе ${vacancyType === 'active' ? 'активных' : 'архивных'} вакансий:`, error);
  }

  return vacancies;
}

/**
 * Собирает список активных вакансий с главной страницы работодателя
 */
export async function collectVacancies(page: Page): Promise<VacancyData[]> {
  return collectVacanciesFromUrl(page, HH_CONFIG.urls.vacancies, 'active');
}

/**
 * Собирает список архивных вакансий
 */
export async function collectArchivedVacancies(page: Page): Promise<VacancyData[]> {
  return collectVacanciesFromUrl(page, HH_CONFIG.urls.archivedVacancies, 'archived');
}