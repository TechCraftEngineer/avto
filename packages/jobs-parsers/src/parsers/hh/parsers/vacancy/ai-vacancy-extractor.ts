import {
  buildDescriptionFromSections,
  buildVacancyDataExtractionPrompt,
  vacancyDataExtractionSchema,
} from "@qbs-autonaim/ai";
import {
  extractVacancyDataFromHtml,
  stripHtmlToBareTags,
  type VacancyParseFromHtmlResult,
} from "@qbs-autonaim/html-parsers";
import { generateObject } from "@qbs-autonaim/lib/ai";
import type { Page } from "puppeteer";
import type { VacancyData } from "../../../types";
import { HH_CONFIG } from "../../core/config/config";
import { getVacancyPrintUrl } from "../../utils/print-url";

// Re-export для обратной совместимости
export { extractVacancyDataFromHtml, type VacancyParseFromHtmlResult };

/**
 * Извлекает HTML-контент print-страницы вакансии.
 * Берётся только div.main-content (основной текст вакансии).
 * Если блок не найден — используется body целиком.
 * Print-версия содержит минимум разметки, удобна для AI-парсинга.
 */
async function fetchPrintPageContent(
  page: Page,
  vacancyUrl: string,
): Promise<string> {
  const printUrl = getVacancyPrintUrl(vacancyUrl);

  await page.goto(printUrl, {
    waitUntil: "domcontentloaded",
    timeout: HH_CONFIG.timeouts.navigation,
  });

  await page.waitForNetworkIdle({
    timeout: HH_CONFIG.timeouts.networkIdle,
  });

  // Для HH employer view print-страницы структура может отличаться от публичной
  const content = await page.evaluate(() => {
    const mainContent = document.querySelector("div.vacancy-description");

    return mainContent?.innerHTML ?? document.body.innerHTML;
  });
  return content;
}

/**
 * Извлекает данные вакансии через AI из HTML-контента print-страницы HH.ru.
 * Контент передаётся боту без стилей и классов — только голые теги.
 */
export async function extractVacancyDataWithAI(
  page: Page,
  vacancyUrl: string,
  options: {
    isArchived?: boolean;
    region?: string;
  } = {},
): Promise<VacancyData | null> {
  try {
    const idFromParam = vacancyUrl.match(/[?&]id=(\d+)/)?.[1];
    const idFromPath = vacancyUrl.match(/\/vacancy\/(\d+)/)?.[1];
    const idFromEmployerView = vacancyUrl.match(/\/vacancy\/view\/(\d+)/)?.[1];
    const externalId = idFromParam ?? idFromPath ?? idFromEmployerView ?? "";

    if (!externalId) {
      console.warn(
        `⚠️ Не удалось извлечь externalId из URL: ${vacancyUrl} (idFromParam=${idFromParam ?? "null"}, idFromPath=${idFromPath ?? "null"}, idFromEmployerView=${idFromEmployerView ?? "null"})`,
      );
      return null;
    }

    const rawHtml = await fetchPrintPageContent(page, vacancyUrl);
    const bareHtml = stripHtmlToBareTags(rawHtml);

    if (!bareHtml.trim()) {
      console.error("❌ Пустой HTML после очистки");
      return null;
    }

    const result = await generateObject({
      schema: vacancyDataExtractionSchema,
      prompt: buildVacancyDataExtractionPrompt(bareHtml),
      generationName: "extract-vacancy-data",
      entityId: externalId,
      metadata: { vacancyUrl, externalId },
    });

    const extracted = result.object;

    if (!extracted?.title?.trim()) {
      console.warn("AI не извлёк название вакансии");
      return null;
    }

    // description для saveBasicVacancy; используется для triggerVacancyRequirementsExtraction.
    // Если AI не разбил по секциям (пустой результат) — используем bareHtml как fallback,
    // чтобы извлечение требований всегда запускалось при наличии контента.
    const description =
      buildDescriptionFromSections(extracted) || bareHtml.trim();

    const vacancyData: VacancyData = {
      id: externalId,
      externalId,
      source: "hh",
      title: extracted.title,
      url: vacancyUrl,
      responsesUrl: null,
      resumesInProgress: "0",
      suitableResumes: "0",
      region: extracted.region ?? options.region ?? "",
      workLocation: extracted.workLocation,
      description,
      isActive: !options.isArchived,
    };

    return vacancyData;
  } catch (error) {
    console.error("❌ Ошибка AI-извлечения данных вакансии:", error);
    return null;
  }
}
