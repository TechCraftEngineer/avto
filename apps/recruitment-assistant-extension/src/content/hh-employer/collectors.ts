/**
 * Сбор вакансий и откликов с пагинацией
 */

import {
  getNextPageButton,
  type ParsedResponse,
  type ParsedVacancy,
  parseActiveVacanciesFromDOM,
  parseArchivedVacanciesFromDOM,
  parseResponsesFromDOM,
} from "../../parsers/hh-employer";

/**
 * Собирает все вакансии (с пагинацией)
 */
export async function collectAllVacancies(
  isActive: boolean,
  onProgress?: (current: number, total: number) => void,
): Promise<ParsedVacancy[]> {
  const all: ParsedVacancy[] = [];
  let pageNum = 0;

  const parseFn = isActive
    ? parseActiveVacanciesFromDOM
    : parseArchivedVacanciesFromDOM;

  while (true) {
    const pageItems = parseFn();
    const seen = new Set(all.map((v) => v.externalId));
    for (const v of pageItems) {
      if (!seen.has(v.externalId)) {
        seen.add(v.externalId);
        all.push(v);
      }
    }

    onProgress?.(all.length, all.length + (pageItems.length > 0 ? 50 : 0));

    const nextBtn = getNextPageButton();
    if (!nextBtn) break;

    (nextBtn as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1500));
    pageNum++;
    if (pageNum >= 100) break;
  }

  return all;
}

/**
 * Собирает все отклики (с пагинацией).
 * Если передан fetchCoverLetters, после каждой страницы вызывает его для сбора сопроводительных писем.
 */
export async function collectAllResponses(
  vacancyExternalId: string,
  onProgress?: (current: number, total: number) => void,
  fetchCoverLetters?: (pageResponses: ParsedResponse[]) => Promise<void>,
): Promise<ParsedResponse[]> {
  const all: ParsedResponse[] = [];
  let pageNum = 0;

  while (true) {
    const pageItems = parseResponsesFromDOM(vacancyExternalId);
    const seen = new Set(all.map((r) => r.externalId));
    for (const r of pageItems) {
      if (!seen.has(r.externalId)) {
        seen.add(r.externalId);
        all.push(r);
      }
    }

    if (pageItems.length > 0 && fetchCoverLetters) {
      await fetchCoverLetters(pageItems);
    }

    onProgress?.(all.length, all.length + (pageItems.length > 0 ? 20 : 0));

    const nextBtn = document.querySelector('[data-qa="pager-next"]');
    if (!nextBtn) break;

    (nextBtn as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1500));
    pageNum++;
    if (pageNum >= 100) break;
  }

  return all;
}

/**
 * Собирает только выбранные вакансии из DOM (без пагинации).
 * Берет только те вакансии, у которых отмечен чекбокс на текущей странице.
 */
export function collectSelectedVacanciesFromCurrentPage(
  isActive: boolean,
): ParsedVacancy[] {
  const parseFn = isActive
    ? parseActiveVacanciesFromDOM
    : parseArchivedVacanciesFromDOM;

  const allVacancies = parseFn();
  const selected: ParsedVacancy[] = [];

  if (isActive) {
    // Для активных вакансий - проверяем наши инжектированные чекбоксы
    const CHECKBOX_CLASS = "recruitment-assistant-vacancy-checkbox";
    const checkedBoxes = document.querySelectorAll<HTMLInputElement>(
      `input.${CHECKBOX_CLASS}:checked`,
    );
    const checkedIds = new Set(
      [...checkedBoxes].map((cb) => cb.dataset.externalId).filter(Boolean),
    );

    for (const v of allVacancies) {
      if (checkedIds.has(v.externalId)) {
        selected.push(v);
      }
    }
  } else {
    // Для архивных - проверяем нативные чекбоксы HH
    const ARCHIVE_CHECKBOX_SELECTOR =
      '[data-qa^="vacancies-dashboard-vacancy-archive-label"] input[type="checkbox"]';
    const checkedBoxes = document.querySelectorAll<HTMLInputElement>(
      ARCHIVE_CHECKBOX_SELECTOR,
    );
    const checkedIds = new Set<string>();

    checkedBoxes.forEach((cb) => {
      if (!cb.checked) return;
      // Извлекаем ID из value или из родительской строки
      const val = cb.value?.trim();
      if (val && val !== "on") {
        checkedIds.add(val);
      } else {
        const row = cb.closest('div[data-qa^="vacancy-archive_"]');
        const dataQa = row?.getAttribute("data-qa") || "";
        const match = dataQa.match(/vacancy-archive_(\d+)/);
        if (match?.[1]) checkedIds.add(match[1]);
      }
    });

    for (const v of allVacancies) {
      if (checkedIds.has(v.externalId)) {
        selected.push(v);
      }
    }
  }

  return selected;
}

/**
 * Собирает только выбранные вакансии (с пагинацией).
 * Проходит страницы начиная с текущей. Для импорта выбранных с предыдущих
 * страниц перейдите на первую страницу списка.
 * @deprecated Используйте collectSelectedVacanciesFromCurrentPage вместо этого
 */
export async function collectSelectedVacancies(
  selectedIds: Set<string>,
  isActive: boolean,
  onProgress?: (current: number, total: number) => void,
): Promise<ParsedVacancy[]> {
  const all: ParsedVacancy[] = [];
  const parseFn = isActive
    ? parseActiveVacanciesFromDOM
    : parseArchivedVacanciesFromDOM;

  for (let pageNum = 0; pageNum < 100; pageNum++) {
    const pageItems = parseFn();
    for (const v of pageItems) {
      if (selectedIds.has(v.externalId)) {
        const seen = new Set(all.map((x) => x.externalId));
        if (!seen.has(v.externalId)) all.push(v);
      }
    }
    onProgress?.(all.length, selectedIds.size);

    const nextBtn = getNextPageButton();
    if (!nextBtn) break;

    (nextBtn as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1500));
  }

  return all;
}
