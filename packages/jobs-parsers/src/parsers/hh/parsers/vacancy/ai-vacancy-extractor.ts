import {
  buildDescriptionFromSections,
  buildVacancyDataExtractionPrompt,
  vacancyDataExtractionSchema,
} from "@qbs-autonaim/ai";
import { generateObject } from "@qbs-autonaim/lib/ai";
import * as cheerio from "cheerio";
import type { Page } from "puppeteer";
import type { VacancyData } from "../../../types";
import { HH_CONFIG } from "../../core/config/config";
import { stripHtmlToBareTags } from "../../utils/html-utils";
import { humanDelay } from "../../utils/human-behavior";
import { getVacancyPrintUrl } from "../../utils/print-url";

/**
 * Результат парсинга HTML вакансии (без Puppeteer).
 * Используется расширением: fetch HTML → отправка на API → AI-парсинг.
 */
export interface VacancyParseFromHtmlResult {
  description: string;
  workLocation?: string | null;
  region?: string | null;
  title?: string;
}

/**
 * Извлекает данные вакансии из HTML через AI.
 * Не требует Puppeteer — принимает готовый HTML (например, от fetch в расширении).
 */
export async function extractVacancyDataFromHtml(
  rawHtml: string,
  vacancyUrl: string,
  options: {
    isArchived?: boolean;
    region?: string;
  } = {},
): Promise<VacancyParseFromHtmlResult | null> {
  try {
    const idFromParam = vacancyUrl.match(/[?&]id=(\d+)/)?.[1];
    const idFromPath = vacancyUrl.match(/\/vacancy\/(\d+)/)?.[1];
    const idFromEmployerView = vacancyUrl.match(/\/vacancy\/view\/(\d+)/)?.[1];
    const externalId = idFromParam ?? idFromPath ?? idFromEmployerView ?? "";

    if (!externalId) {
      console.warn(`⚠️ Не удалось извлечь externalId из URL: ${vacancyUrl}`);
      return null;
    }

    const $ = cheerio.load(rawHtml);

    // Пробуем несколько селекторов для извлечения контента вакансии
    let mainContent = "";
    let usedSelector = "";

    // 1. Основной контейнер print-версии
    const printContent = $(".vacancy-description").html();
    if (printContent) {
      mainContent = printContent;
      usedSelector = ".vacancy-description";
    } else {
      // 2. Fallback: ищем основной контент по классам
      const contentByClass = $(
        ".main-content, .content, .vacancy-content",
      ).html();
      if (contentByClass) {
        mainContent = contentByClass;
        usedSelector = ".main-content, .content, .vacancy-content";
      } else {
        // 3. Последний fallback: весь body (может содержать лишнее)
        mainContent = $("body").html() ?? "";
        usedSelector = "body (fallback)";
      }
    }

    console.log(
      `📄 Извлечение контента вакансии ${externalId}: селектор = ${usedSelector}, длина HTML = ${mainContent.length}`,
    );

    const bareHtml = stripHtmlToBareTags(mainContent);

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

    // Fallback на bareHtml если AI не разбил по секциям (для корректного извлечения требований)
    const description =
      buildDescriptionFromSections(extracted) || bareHtml.trim();

    return {
      description,
      workLocation: extracted.workLocation ?? null,
      region: extracted.region ?? options.region ?? null,
      title: extracted.title,
    };
  } catch (error) {
    console.error("❌ Ошибка AI-извлечения данных вакансии из HTML:", error);
    return null;
  }
}

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
