import type { Page } from "puppeteer";
import { saveBasicVacancy } from "../../../services/vacancy";
import type { VacancyData } from "../../types";
import { HH_CONFIG } from "../../core/config/config";
import { humanDelay } from "../../utils/human-behavior";
import { collectVacancies, collectArchivedVacancies } from "./vacancy-collector";
import { saveBasicVacancies, parseVacancyDescriptions } from "./vacancy-processor";
import { extractSingleVacancy } from "./vacancy-extractor";

interface ParseResult {
  vacancies: VacancyData[];
  imported: number;
  updated: number;
  failed: number;
}

export async function parseVacancies(
  page: Page,
  workspaceId: string,
): Promise<ParseResult> {
  console.log(`🚀 Начинаем парсинг активных вакансий`);

  // ЭТАП 1: Собираем список всех активных вакансий
  console.log("\n📋 ЭТАП 1: Сбор списка активных вакансий...");
  const vacancies = await collectVacancies(page);

  if (vacancies.length === 0) {
    console.log("⚠️ Не найдено активных вакансий");
    return { vacancies: [], imported: 0, updated: 0, failed: 0 };
  }

  console.log(`✅ Найдено активных вакансий: ${vacancies.length}`);

  // ЭТАП 2: Сохраняем базовую информацию всех вакансий
  console.log("\n💾 ЭТАП 2: Сохранение базовой информации...");
  const { newVacancyIds, savedCount, errorCount } = await saveBasicVacancies(
    vacancies,
    workspaceId,
  );

  // ЭТАП 3: Парсим описания для вакансий без описания
  console.log("\n📊 ЭТАП 3: Парсинг описаний вакансий...");
  const descriptionStats = await parseVacancyDescriptions(
    page,
    vacancies,
    newVacancyIds,
  );

  console.log(`\n🎉 Парсинг активных вакансий завершен!`);

  return {
    vacancies,
    imported: newVacancyIds.size,
    updated: savedCount - newVacancyIds.size,
    failed: errorCount + descriptionStats.errorCount,
  };
}

export async function parseArchivedVacancies(
  page: Page,
  workspaceId: string,
): Promise<ParseResult> {
  console.log(`🚀 Начинаем парсинг архивных вакансий`);

  // ЭТАП 1: Собираем список всех архивных вакансий
  console.log("\n📋 ЭТАП 1: Сбор списка архивных вакансий...");
  const archivedVacancies = await collectArchivedVacancies(page);

  if (archivedVacancies.length === 0) {
    console.log("⚠️ Не найдено архивных вакансий");
    return { vacancies: [], imported: 0, updated: 0, failed: 0 };
  }

  console.log(`✅ Найдено архивных вакансий: ${archivedVacancies.length}`);

  // ЭТАП 2: Сохраняем базовую информацию всех вакансий
  console.log("\n💾 ЭТАП 2: Сохранение базовой информации...");
  const { newVacancyIds, savedCount, errorCount } = await saveBasicVacancies(
    archivedVacancies,
    workspaceId,
  );

  // ЭТАП 3: Парсим описания для вакансий без описания
  console.log("\n📊 ЭТАП 3: Парсинг описаний вакансий...");
  const descriptionStats = await parseVacancyDescriptions(
    page,
    archivedVacancies,
    newVacancyIds,
  );

  console.log(`\n🎉 Парсинг архивных вакансий завершен!`);

  return {
    vacancies: archivedVacancies,
    imported: newVacancyIds.size,
    updated: savedCount - newVacancyIds.size,
    failed: errorCount + descriptionStats.errorCount,
  };
}

export async function parseSingleVacancy(
  page: Page,
  url: string,
  workspaceId: string,
): Promise<{ vacancy: VacancyData | null; success: boolean }> {
  console.log(`🔍 Начинаем парсинг отдельной вакансии: ${url}`);

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    await humanDelay(HH_CONFIG.delays.readingPage.min, HH_CONFIG.delays.readingPage.max);

    const vacancyData = await extractSingleVacancy(page, url);

    if (vacancyData) {
      const saved = await saveBasicVacancy(vacancyData, workspaceId);
      if (saved) {
        console.log(`✅ Вакансия сохранена: ${vacancyData.title}`);
        return { vacancy: vacancyData, success: true };
      }
    }

    return { vacancy: null, success: false };
  } catch (error) {
    console.error(`❌ Ошибка парсинга отдельной вакансии:`, error);
    return { vacancy: null, success: false };
  }
}