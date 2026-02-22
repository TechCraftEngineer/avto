/**
 * Улучшенный сбор вакансий и откликов с имитацией человеческого поведения
 */

import {
  getNextPageButton,
  type ParsedResponse,
  type ParsedVacancy,
  parseActiveVacanciesFromDOM,
  parseArchivedVacanciesFromDOM,
  parseResponsesFromDOM,
} from "../../parsers/hh-employer";
import { simulateScroll } from "../../utils/stealth";

/**
 * Собирает все вакансии (с пагинацией и имитацией скроллинга)
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

    // Имитация скроллинга перед переходом на следующую страницу
    await simulateScroll();

    (nextBtn as HTMLElement).click();
    // Случайная задержка 1.5-3 секунды между страницами
    const delay = 1500 + Math.random() * 1500;
    await new Promise((r) => setTimeout(r, delay));
    pageNum++;
    if (pageNum >= 100) break;
  }

  return all;
}

/**
 * Собирает все отклики (с пагинацией и имитацией скроллинга)
 */
export async function collectAllResponses(
  vacancyExternalId: string,
  onProgress?: (current: number, total: number) => void,
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

    onProgress?.(all.length, all.length + (pageItems.length > 0 ? 20 : 0));

    const nextBtn = document.querySelector('[data-qa="pager-next"]');
    if (!nextBtn) break;

    // Имитация скроллинга перед переходом на следующую страницу
    await simulateScroll();

    (nextBtn as HTMLElement).click();
    // Случайная задержка 1.5-3 секунды между страницами
    const delay = 1500 + Math.random() * 1500;
    await new Promise((r) => setTimeout(r, delay));
    pageNum++;
    if (pageNum >= 100) break;
  }

  return all;
}

/**
 * Собирает только выбранные вакансии (с пагинацией и имитацией скроллинга)
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

    // Имитация скроллинга перед переходом на следующую страницу
    await simulateScroll();

    (nextBtn as HTMLElement).click();
    // Случайная задержка 1.5-3 секунды между страницами
    const delay = 1500 + Math.random() * 1500;
    await new Promise((r) => setTimeout(r, delay));
  }

  return all;
}
