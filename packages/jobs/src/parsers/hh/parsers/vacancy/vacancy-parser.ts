import type { Page } from "puppeteer";
import { z } from "zod";
import type { VacancyData } from "~/parsers/types";
import { saveBasicVacancy } from "~/services/vacancy";
import { HH_CONFIG } from "../../core/config/config";
import { humanDelay } from "../../utils/human-behavior";
import {
  collectArchivedVacancies,
  collectVacancies,
} from "./vacancy-collector";
import { extractSingleVacancy } from "./vacancy-extractor";
import {
  parseVacancyDescriptions,
  saveBasicVacancies,
} from "./vacancy-processor";

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
  isArchived = false,
  region?: string,
): Promise<{ vacancy: VacancyData | null; success: boolean; isNew?: boolean }> {
  // Input validation
  const InputSchema = z.object({
    url: z.url("Некорректный URL вакансии"),
    workspaceId: z.string().min(1, "workspaceId не может быть пустым"),
  });

  const validationResult = InputSchema.safeParse({ url, workspaceId });

  if (!validationResult.success) {
    console.error(
      "❌ Ошибка валидации входных параметров parseSingleVacancy:",
      validationResult.error.issues,
    );
    return { vacancy: null, success: false };
  }

  console.log(`🔍 Начинаем парсинг отдельной вакансии: ${url}`);

  try {
    await page.goto(url, {
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

    // Если статус не передан явно, определяем его по странице
    if (!isArchived) {
      // Проверяем, есть ли на странице индикатор архивной вакансии
      const isArchivedOnPage = await page.evaluate(() => {
        const archivedElement = document.querySelector(
          '[data-qa="vacancy-info-archived"]',
        );
        return !!archivedElement;
      });
      isArchived = isArchivedOnPage;
    }

    const vacancyData = await extractSingleVacancy(
      page,
      url,
      isArchived,
      region,
    );

    if (vacancyData) {
      const saved = await saveBasicVacancy(vacancyData, workspaceId);
      if (saved.success) {
        const isNew = saved.data.isNew;
        console.log(`✅ Вакансия сохранена: ${vacancyData.title}`);
        return { vacancy: vacancyData, success: true, isNew };
      }
    }

    return { vacancy: null, success: false };
  } catch (error) {
    console.error(`❌ Ошибка парсинга отдельной вакансии:`, error);
    return { vacancy: null, success: false };
  }
}
