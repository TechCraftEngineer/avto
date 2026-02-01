import type { Page } from "puppeteer";
import {
  hasVacancyDescription,
  saveBasicVacancy,
  updateVacancyDescription,
} from "~/services/vacancy";
import type { VacancyData } from "~/parsers/types";
import { HH_CONFIG } from "../../core/config/config";
import { humanDelay } from "../../utils/human-behavior";

/**
 * Сохраняет базовую информацию всех вакансий
 */
export async function saveBasicVacancies(
  vacancies: VacancyData[],
  workspaceId: string,
): Promise<{ newVacancyIds: Set<string>; savedCount: number; errorCount: number }> {
  const newVacancyIds = new Set<string>();
  let savedCount = 0;
  let errorCount = 0;

  for (const vacancy of vacancies) {
    try {
      const saved = await saveBasicVacancy(vacancy, workspaceId);
      if (saved) {
        savedCount++;
        newVacancyIds.add(vacancy.externalId);
      }
    } catch (error) {
      console.error(`❌ Ошибка сохранения вакансии ${vacancy.externalId}:`, error);
      errorCount++;
    }

    // Небольшая задержка между сохранениями
    await humanDelay(100, 300);
  }

  console.log(`💾 Сохранено вакансий: ${savedCount}, ошибок: ${errorCount}`);
  return { newVacancyIds, savedCount, errorCount };
}

/**
 * Парсит описания вакансий для новых вакансий
 */
export async function parseVacancyDescriptions(
  page: Page,
  vacancies: VacancyData[],
  newVacancyIds: Set<string>,
): Promise<{ successCount: number; errorCount: number }> {
  let successCount = 0;
  let errorCount = 0;

  for (const vacancy of vacancies) {
    // Парсим описание только для новых вакансий
    if (!newVacancyIds.has(vacancy.externalId)) {
      continue;
    }

    try {
      const hasDescription = await hasVacancyDescription(vacancy.externalId);

      if (!hasDescription) {
        console.log(`📝 Парсим описание для вакансии: ${vacancy.title}`);

        await page.goto(vacancy.url, {
          waitUntil: "domcontentloaded",
          timeout: HH_CONFIG.timeouts.navigation,
        });

        await page.waitForNetworkIdle({
          timeout: HH_CONFIG.timeouts.networkIdle,
        });

        await humanDelay(HH_CONFIG.delays.readingPage.min, HH_CONFIG.delays.readingPage.max);

        const description = await extractVacancyDescription(page);

        if (description) {
          await updateVacancyDescription(vacancy.externalId, description);
          successCount++;
          console.log(`✅ Описание сохранено для: ${vacancy.title}`);
        }
      }
    } catch (error) {
      console.error(`❌ Ошибка парсинга описания для ${vacancy.externalId}:`, error);
      errorCount++;
    }

    // Задержка между обработкой вакансий
    await humanDelay(HH_CONFIG.delays.betweenResumes.min, HH_CONFIG.delays.betweenResumes.max);
  }

  console.log(`📊 Описаний обработано: ${successCount}, ошибок: ${errorCount}`);
  return { successCount, errorCount };
}

/**
 * Извлекает описание вакансии со страницы
 */
async function extractVacancyDescription(page: Page): Promise<string | null> {
  try {
    const description = await page.$eval('[data-qa="vacancy-description"]', (element) => {
      return element.textContent?.trim() || null;
    });

    return description;
  } catch (error) {
    console.error('❌ Ошибка извлечения описания вакансии:', error);
    return null;
  }
}