import type { Page } from "puppeteer";
import type { VacancyData } from "../../types";
import { HH_CONFIG } from "../../core/config/config";
import { humanDelay } from "../../utils/human-behavior";

/**
 * Извлекает данные одной вакансии
 */
export async function extractSingleVacancy(page: Page, url: string): Promise<VacancyData | null> {
  try {
    const vacancyData = await page.$eval('body', () => {
      const titleElement = document.querySelector('[data-qa="vacancy-title"]');
      const title = titleElement?.textContent?.trim() || '';

      const companyElement = document.querySelector('[data-qa="vacancy-company-name"]');
      const company = companyElement?.textContent?.trim() || '';

      const salaryElement = document.querySelector('[data-qa="vacancy-salary"]');
      const salary = salaryElement?.textContent?.trim() || '';

      const locationElement = document.querySelector('[data-qa="vacancy-view-location"]');
      const location = locationElement?.textContent?.trim() || '';

      const descriptionElement = document.querySelector('[data-qa="vacancy-description"]');
      const description = descriptionElement?.textContent?.trim() || '';

      const idMatch = window.location.href.match(/\/vacancy\/(\d+)/);
      const externalId = idMatch ? idMatch[1] : '';

      return {
        title,
        url: window.location.href,
        company,
        salary,
        location,
        description,
        externalId,
        status: 'active' as const,
        date: new Date().toISOString(),
      };
    });

    return vacancyData;
  } catch (error) {
    console.error('❌ Ошибка извлечения данных вакансии:', error);
    return null;
  }
}