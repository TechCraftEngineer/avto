import type { Page } from "puppeteer";
import type { VacancyData } from "~/parsers/types";

/**
 * Извлекает данные одной вакансии
 */
export async function extractSingleVacancy(
  page: Page,
  _url: string,
  isArchived = false,
  region?: string,
): Promise<VacancyData | null> {
  try {
    const vacancyData = await page.$eval("body", () => {
      const titleElement = document.querySelector('[data-qa="vacancy-title"]');
      const title = titleElement?.textContent?.trim() || "";

      const companyElement = document.querySelector(
        '[data-qa="vacancy-company-name"]',
      );
      const company = companyElement?.textContent?.trim() || "";

      const salaryElement = document.querySelector(
        '[data-qa="vacancy-salary"]',
      );
      const salary = salaryElement?.textContent?.trim() || "";

      // Локация работы (где фактически нужно работать)
      const workLocationElement = document.querySelector(
        '[data-qa="vacancy-view-location"]',
      );
      const workLocation = workLocationElement?.textContent?.trim() || "";

      const descriptionElement = document.querySelector(
        '[class="vacancy-description"]',
      );
      const description = descriptionElement?.textContent?.trim() || "";

      const idMatch = window.location.href.match(/\/vacancy\/(\d+)/);
      const externalId = idMatch ? idMatch[1] : "";

      return {
        title,
        url: window.location.href,
        company,
        salary,
        workLocation,
        description,
        externalId,
        status: "active" as const,
        date: new Date().toISOString(),
      };
    });

    // Convert to VacancyData format with all required fields
    const fullVacancyData: VacancyData = {
      id: vacancyData.externalId || "",
      externalId: vacancyData.externalId,
      source: "hh",
      title: vacancyData.title,
      url: vacancyData.url,
      views: "0",
      responses: "0",
      responsesUrl: null,
      newResponses: "0",
      resumesInProgress: "0",
      suitableResumes: "0",
      // Используем регион из списка вакансий, если передан, иначе берем workLocation
      region: region || vacancyData.workLocation,
      workLocation: vacancyData.workLocation,
      description: vacancyData.description,
      isActive: !isArchived,
    };

    return fullVacancyData;
  } catch (error) {
    console.error("❌ Ошибка извлечения данных вакансии:", error);
    return null;
  }
}
