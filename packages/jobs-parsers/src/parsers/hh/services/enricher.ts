import os from "node:os";
import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  getResponsesWithoutDetails,
  updateResponseDetails,
  uploadResumePdf,
} from "@qbs-autonaim/jobs/services/response";
import { Log } from "crawlee";
import type { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { performLogin } from "../core/auth/auth";
import { setupBrowser, setupPage } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { HH_CONFIG } from "../core/config/config";
import { parseResumeExperience } from "../parsers/resume/resume-parser";

puppeteer.use(StealthPlugin());

// Configure Crawlee storage to use temp directory
process.env.CRAWLEE_STORAGE_DIR = os.tmpdir();

async function checkAndPerformLogin(
  page: Page,
  email: string,
  password: string,
  workspaceId: string,
) {
  console.log("🔐 Проверка авторизации...");

  await page.goto(HH_CONFIG.urls.login, {
    waitUntil: "domcontentloaded",
    timeout: HH_CONFIG.timeouts.navigation,
  });

  await page.waitForNetworkIdle({
    timeout: HH_CONFIG.timeouts.networkIdle,
  });

  const loginInput = await page.$('input[type="text"][name="username"]');
  if (loginInput) {
    // Create a simple logger wrapper that implements the Log interface
    const log = new Log();

    await performLogin(page, log, email, password, workspaceId);
  } else {
    console.log("✅ Успешно авторизованы");
  }
}

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

  const browser = await setupBrowser();

  try {
    const page = await setupPage(browser, null);

    await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

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

        // Navigate to resume page
        await page.goto(response.resumeUrl, {
          waitUntil: "domcontentloaded",
          timeout: HH_CONFIG.timeouts.navigation,
        });

        await page.waitForNetworkIdle({
          timeout: HH_CONFIG.timeouts.networkIdle,
        });

        // Parse resume experience
        const experienceData = await parseResumeExperience(
          page,
          response.resumeUrl,
          response.candidateName || "",
        );

        // Download and upload PDF if available
        let resumePdfFileId: string | null = null;
        if (experienceData.pdfBuffer) {
          const uploadResult = await uploadResumePdf(
            experienceData.pdfBuffer,
            response.resumeId,
          );
          if (uploadResult.success) {
            resumePdfFileId = uploadResult.data;
          }
        }

        // Update response with enriched data
        const updateResult = await updateResponseDetails({
          vacancyId: response.entityId,
          resumeId: response.resumeId,
          resumeUrl: response.resumeUrl,
          candidateName: response.candidateName || "",
          experience: JSON.stringify(experienceData.experience),
          contacts: experienceData.contacts,
          phone: experienceData.phone ?? null,
          resumePdfFileId,
        });

        if (!updateResult.success) {
          throw new Error(
            `Failed to update response details: ${updateResult.error}`,
          );
        }

        enriched++;
        console.log(`✅ Отклик обогащен: ${response.candidateName}`);
      } catch (error) {
        errors++;
        console.error(
          `❌ Ошибка обогащения отклика ${response.candidateName}:`,
          error,
        );
      }

      // Small delay between processing responses
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
