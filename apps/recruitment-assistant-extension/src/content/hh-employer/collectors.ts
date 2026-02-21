/**
 * Сбор вакансий и откликов с пагинацией
 */

import {
  getNextPageButton,
  parseActiveVacanciesFromDOM,
  parseArchivedVacanciesFromDOM,
  parseResponsesFromDOM,
  type ParsedResponse,
  type ParsedVacancy,
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
 * Собирает только выбранные вакансии (с пагинацией).
 * Проходит страницы начиная с текущей. Для импорта выбранных с предыдущих
 * страниц перейдите на первую страницу списка.
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
