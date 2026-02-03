import os from "node:os";
import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { getResponsesWithoutDetails } from "@qbs-autonaim/jobs/services/response";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { enrichResumeData } from "./resume-enrichment";

puppeteer.use(StealthPlugin());

// Configure Crawlee storage to use temp directory
process.env.CRAWLEE_STORAGE_DIR = os.tmpdir();

// Main enricher function
export async function enrichHHResponses(
  workspaceId: string,
  _limit?: number,
): Promise<{
  enriched: number;
  errors: number;
  total: number;
}> {
  console.log("🚀 Запуск обогащения откликов HH...");

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  // Get responses that need enrichment
  const responsesResult = await getResponsesWithoutDetails();

  if (!responsesResult.success) {
    throw new Error(responsesResult.error);
  }

  const responsesToEnrich = responsesResult.data;

  if (responsesToEnrich.length === 0) {
    console.log("ℹ️ Нет откликов, требующих обогащения");
    return { enriched: 0, errors: 0, total: 0 };
  }

  console.log(
    `📋 Найдено откликов для обогащения: ${responsesToEnrich.length}`,
  );

  const { browser, page } = await setupPageWithAuth(
    workspaceId,
    credentials.email,
    credentials.password,
  );

  try {
    let enriched = 0;
    let errors = 0;

    for (let i = 0; i < responsesToEnrich.length; i++) {
      const response = responsesToEnrich[i];

      if (!response || !response.resumeUrl || !response.resumeId) {
        console.warn(
          `⚠️ Пропускаем отклик ${i + 1}: отсутствуют необходимые данные`,
        );
        continue;
      }

      // Skip non-vacancy responses since updateResponseDetails expects vacancyId
      if (response.entityType !== "vacancy") {
        console.warn(
          `⚠️ Пропускаем отклик ${i + 1}: тип сущности ${response.entityType}, ожидается vacancy`,
        );
        continue;
      }

      try {
        console.log(
          `🔍 Обогащение отклика ${i + 1}/${responsesToEnrich.length}: ${response.candidateName}`,
        );

        const result = await enrichResumeData({
          page,
          entityId: response.entityId,
          resumeId: response.resumeId,
          resumeUrl: response.resumeUrl,
          candidateName: response.candidateName || "",
          globalCandidateId: response.globalCandidateId,
        });

        if (result.success) {
          enriched++;
        } else {
          errors++;
        }
      } catch (error) {
        errors++;
        console.error(
          `❌ Ошибка обогащения отклика ${response.candidateName}:`,
          error,
        );
      }
    }

    console.log(
      `🎉 Обогащение завершено: ${enriched} успешно, ${errors} ошибок`,
    );

    return {
      enriched,
      errors,
      total: responsesToEnrich.length,
    };
  } finally {
    await closeBrowserSafely(browser);
  }
}
