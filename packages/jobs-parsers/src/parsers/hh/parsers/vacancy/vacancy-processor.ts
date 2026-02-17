import {
  getVacancyByExternalId,
  saveBasicVacancy,
  updateVacancyDescription,
} from "@qbs-autonaim/jobs/services/vacancy";
import type { Page } from "puppeteer";
import type { VacancyData } from "../../../types";
import { HH_CONFIG } from "../../core/config/config";
import { humanDelay } from "../../utils/human-behavior";
import { extractVacancyDataWithAI } from "./ai-vacancy-extractor";

/**
 * Сохраняет базовую информацию всех вакансий
 */
export async function saveBasicVacancies(
  vacancies: VacancyData[],
  workspaceId: string,
): Promise<{
  newVacancyIds: Set<string>;
  savedCount: number;
  errorCount: number;
}> {
  const newVacancyIds = new Set<string>();
  let savedCount = 0;
  let errorCount = 0;

  for (const vacancy of vacancies) {
    if (!vacancy.externalId) {
      console.warn(`⚠️ Пропускаем вакансию без externalId: ${vacancy.title}`);
      continue;
    }

    try {
      const saved = await saveBasicVacancy(vacancy, workspaceId);
      if (saved.success) {
        savedCount++;
        newVacancyIds.add(vacancy.externalId);
      }
    } catch (error) {
      console.error(
        `❌ Ошибка сохранения вакансии ${vacancy.externalId}:`,
        error,
      );
      errorCount++;
    }

    await humanDelay(100, 300);
  }

  console.log(`💾 Сохранено вакансий: ${savedCount}, ошибок: ${errorCount}`);
  return { newVacancyIds, savedCount, errorCount };
}

/**
 * Парсит описания вакансий через AI для новых вакансий
 */
export async function parseVacancyDescriptions(
  page: Page,
  vacancies: VacancyData[],
  newVacancyIds: Set<string>,
  workspaceId: string,
): Promise<{ successCount: number; errorCount: number }> {
  let successCount = 0;
  let errorCount = 0;

  for (const vacancy of vacancies) {
    if (!vacancy.externalId || !newVacancyIds.has(vacancy.externalId)) {
      continue;
    }

    if (!vacancy.url) {
      console.warn(`⚠️ Пропускаем вакансию без URL: ${vacancy.title}`);
      continue;
    }

    try {
      const vacancyResult = await getVacancyByExternalId(
        workspaceId,
        vacancy.externalId,
      );

      if (!vacancyResult.success || !vacancyResult.data) {
        console.warn(`⚠️ Вакансия не найдена в БД: ${vacancy.externalId}`);
        continue;
      }

      const dbVacancy = vacancyResult.data;
      if (dbVacancy.description?.trim()) {
        continue;
      }

      console.log(`📝 Парсим описание через AI для вакансии: ${vacancy.title}`);

      const vacancyData = await extractVacancyDataWithAI(page, vacancy.url, {
        isArchived: !vacancy.isActive,
        region: vacancy.region,
      });

      if (vacancyData?.description) {
        const updateResult = await updateVacancyDescription(
          dbVacancy.id,
          vacancyData.description,
          vacancyData.workLocation,
          vacancyData.region,
        );

        if (updateResult.success) {
          successCount++;
          console.log(`✅ Описание сохранено для: ${vacancy.title}`);
        }
      }
    } catch (error) {
      console.error(
        `❌ Ошибка парсинга описания для ${vacancy.externalId}:`,
        error,
      );
      errorCount++;
    }

    await humanDelay(
      HH_CONFIG.delays.betweenResumes.min,
      HH_CONFIG.delays.betweenResumes.max,
    );
  }

  console.log(`📊 Описаний обработано: ${successCount}, ошибок: ${errorCount}`);
  return { successCount, errorCount };
}
