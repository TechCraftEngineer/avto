import os from "node:os";
import { eq, getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { Log } from "crawlee";
import puppeteer from "puppeteer-extra";
import type { Page } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  loadCookies,
  performLogin,
  saveCookies,
} from "../../../parsers/hh/auth";
import { HH_CONFIG } from "../../../parsers/hh/config";
import { parseResumeExperience } from "../../../parsers/hh/resume-parser";
import { setupBrowser, setupPage } from "../../../parsers/hh/browser-setup";
import { closeBrowserSafely } from "../../../parsers/hh/browser-utils";
import { extractTelegramUsername } from "../../../services/messaging";
import {
  updateResponseDetails,
  uploadCandidatePhoto,
  uploadResumePdf,
} from "../../../services/response";
import { inngest } from "../../client";

puppeteer.use(StealthPlugin());

// Configure Crawlee storage to use temp directory
process.env.CRAWLEE_STORAGE_DIR = os.tmpdir();

async function checkAndPerformLogin(
  page: Page,
  email: string,
  password: string,
  workspaceId: string,
): Promise<void> {
  try {
    await page.goto(HH_CONFIG.urls.login, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    const loginInput = await page.$('input[type="text"][name="username"]');
    if (loginInput) {
      const log = new Log();
      await performLogin(page, log, email, password, workspaceId);
    }

    const cookies = await page.cookies();
    await saveCookies("hh", cookies, workspaceId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`HH login failed: ${message}`);
  }
}

/**
 * Inngest функция для обновления конкретного резюме
 */
export const refreshSingleResumeFunction = inngest.createFunction(
  {
    id: "refresh-single-resume",
    name: "Refresh Single Resume",
  },
  { event: "response/resume.refresh" },
  async ({ event, step }) => {
    const { responseId } = event.data;

    const responseData = await step.run("fetch-response", async () => {
      console.log(`🚀 Запуск обновления резюме для отклика: ${responseId}`);

      const result = await db.query.response.findFirst({
        where: eq(response.id, responseId),
        columns: {
          id: true,
          entityId: true,
          resumeId: true,
          resumeUrl: true,
          candidateName: true,
        },
      });

      if (!result) {
        throw new Error(`Отклик ${responseId} не найден`);
      }

      // Получаем vacancy отдельно
      const vacancy = await db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, result.entityId),
        columns: {
          workspaceId: true,
        },
      });

      if (!vacancy?.workspaceId) {
        throw new Error(`WorkspaceId не найден для отклика ${responseId}`);
      }

      return { ...result, vacancy };
    });

    const credentials = await step.run("get-credentials", async () => {
      const creds = await getIntegrationCredentials(
        db,
        "hh",
        responseData.vacancy.workspaceId,
      );
      if (!creds?.email || !creds?.password) {
        throw new Error("HH credentials не найдены в интеграциях");
      }
      return { email: creds.email, password: creds.password };
    });

    await step.run("parse-resume", async () => {
      const savedCookies = await loadCookies(
        "hh",
        responseData.vacancy.workspaceId,
      );
      const browser = await setupBrowser();

      try {
        const page = await setupPage(browser, savedCookies);
        await checkAndPerformLogin(
          page,
          credentials.email,
          credentials.password,
          responseData.vacancy.workspaceId,
        );

        console.log(`📊 Парсинг резюме: ${responseData.candidateName}`);

        const experienceData = await parseResumeExperience(
          page,
          responseData.resumeUrl ?? "",
          responseData.candidateName ?? undefined,
        );

        let telegramUsername: string | null = null;
        if (experienceData.contacts) {
          telegramUsername = await extractTelegramUsername(
            experienceData.contacts,
          );
          if (telegramUsername) {
            console.log(`✅ Найден Telegram username: @${telegramUsername}`);
          }
        }

        let resumePdfFileId: string | null = null;
        if (experienceData.pdfBuffer) {
          const result = await uploadResumePdf(
            experienceData.pdfBuffer,
            responseData.resumeId ?? "",
          );
          if (result.success) {
            resumePdfFileId = result.data;
          }
        }

        let photoFileId: string | null = null;
        if (experienceData.photoBuffer && experienceData.photoMimeType) {
          console.log(
            `📸 Загрузка фото кандидата в S3 (размер: ${experienceData.photoBuffer.length} байт, тип: ${experienceData.photoMimeType})`,
          );
          const uploadResult = await uploadCandidatePhoto(
            experienceData.photoBuffer,
            responseData.resumeId ?? "",
            experienceData.photoMimeType,
          );
          if (uploadResult.success) {
            photoFileId = uploadResult.data;
            console.log(`✅ Фото загружено в S3, file ID: ${photoFileId}`);
          } else {
            console.log(`⚠️ Ошибка загрузки фото в S3: ${uploadResult.error}`);
          }
        } else {
          console.log(
            `⚠️ Фото не будет загружено: photoBuffer=${!!experienceData.photoBuffer}, photoMimeType=${!!experienceData.photoMimeType}`,
          );
        }

        const updateResult = await updateResponseDetails({
          vacancyId: responseData.entityId,
          resumeId: responseData.resumeId ?? "",
          resumeUrl: responseData.resumeUrl ?? "",
          candidateName: responseData.candidateName ?? "",
          experience: experienceData.experience || "",
          contacts: experienceData.contacts,
          phone: experienceData.phone,
          telegramUsername,
          resumePdfFileId,
          photoFileId,
        });

        if (!updateResult.success) {
          throw new Error(
            `Failed to update response details: ${updateResult.error}`,
          );
        }

        console.log(
          `✅ Резюме обновлено для: ${responseData.candidateName ?? "кандидата"}`,
        );
      } finally {
        await closeBrowserSafely(browser);
      }
    });

    return {
      success: true,
      responseId,
    };
  },
);
