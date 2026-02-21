/**
 * Парсер списков вакансий HH.ru (активные и архивные)
 * Использует те же data-qa селекторы, что и серверный парсер
 */

export interface ParsedVacancy {
  externalId: string;
  title: string;
  url: string;
  region?: string;
  views?: string;
  responses?: string;
  isActive: boolean;
}

/**
 * Парсит активные вакансии со страницы hh.ru/employer/vacancies
 */
export function parseActiveVacanciesFromDOM(): ParsedVacancy[] {
  const elements = document.querySelectorAll(
    '[data-qa="vacancy-serp__vacancy"]',
  );
  const vacancies: ParsedVacancy[] = [];

  elements.forEach((element) => {
    const titleEl = element.querySelector(
      '[data-qa="vacancy-serp__vacancy-title"]',
    ) as HTMLAnchorElement;
    const url = titleEl?.href || "";
    const idMatch = url.match(/\/vacancy\/(\d+)/);
    const externalId = idMatch?.[1] || "";

    const locationEl = element.querySelector(
      '[data-qa="vacancy-serp__vacancy-address"]',
    );
    const viewsEl = element.querySelector(
      '[data-qa="vacancy-serp__vacancy-views"]',
    );
    const responsesEl = element.querySelector(
      '[data-qa="vacancy-serp__vacancy-response-count"]',
    );

    vacancies.push({
      externalId,
      title: titleEl?.textContent?.trim() || "",
      url,
      region: locationEl?.textContent?.trim(),
      views: viewsEl?.textContent?.trim(),
      responses: responsesEl?.textContent?.trim(),
      isActive: true,
    });
  });

  return vacancies.filter((v) => v.externalId && v.url);
}

/** Контейнер архивных вакансий на HH */
const ARCHIVE_CONTAINER = "div.vacancy-dashboard-archive";

/**
 * Парсит архивные вакансии со страницы hh.ru/employer/vacancies/archived
 */
export function parseArchivedVacanciesFromDOM(): ParsedVacancy[] {
  const root = document.querySelector(ARCHIVE_CONTAINER) ?? document;
  const elements = root.querySelectorAll('div[data-qa^="vacancy-archive_"]');
  const vacancies: ParsedVacancy[] = [];

  elements.forEach((element) => {
    const dataQa = element.getAttribute("data-qa") || "";
    const externalId = dataQa.match(/vacancy-archive_(\d+)/)?.[1] || "";

    const titleEl = element.querySelector(
      'span[data-qa^="vacancies-dashboard-vacancy--archive-name_"][data-qa$="-text"]',
    );
    const urlEl = element.querySelector(
      'a[data-qa^="vacancies-dashboard-vacancy--archive-name_"]',
    ) as HTMLAnchorElement;
    const url = urlEl?.href || "";
    const regionEl = element.querySelector(
      'div[data-qa="table-flexible-cell-archiveVacancyArea"]',
    );

    vacancies.push({
      externalId,
      title: titleEl?.textContent?.trim() || "",
      url,
      region: regionEl?.textContent?.trim(),
      isActive: false,
    });
  });

  return vacancies.filter((v) => v.externalId && v.url);
}

export function getNextPageButton(): Element | null {
  return document.querySelector('[data-qa="pager-next"]');
}
