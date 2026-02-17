import {
  buildDescriptionFromSections,
  buildVacancyDataExtractionPrompt,
  vacancyDataExtractionSchema,
} from "@qbs-autonaim/ai";
import { generateObject } from "@qbs-autonaim/lib/ai";
import type { Page } from "puppeteer";
import type { VacancyData } from "../../../types";
import { HH_CONFIG } from "../../core/config/config";
import { stripHtmlToBareTags } from "../../utils/html-utils";
import { humanDelay } from "../../utils/human-behavior";
import { getVacancyPrintUrl } from "../../utils/print-url";

/**
 * Извлекает HTML-контент print-страницы вакансии.
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

  await humanDelay(
    HH_CONFIG.delays.readingPage.min,
    HH_CONFIG.delays.readingPage.max,
  );

  const content = await page.evaluate(() => document.body.innerHTML);
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
    const externalId = idFromParam ?? idFromPath ?? "";

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

    const description = buildDescriptionFromSections(extracted);

    const vacancyData: VacancyData = {
      id: externalId,
      externalId,
      source: "hh",
      title: extracted.title,
      url: vacancyUrl,
      views: "0",
      responses: "0",
      responsesUrl: null,
      newResponses: "0",
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
