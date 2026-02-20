import {
  buildDescriptionFromSections,
  buildVacancyDataExtractionPrompt,
  vacancyDataExtractionSchema,
} from "@qbs-autonaim/ai";
import { generateObject } from "@qbs-autonaim/lib/ai";
import * as cheerio from "cheerio";
import { stripHtmlToBareTags } from "./utils/html-utils";

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
