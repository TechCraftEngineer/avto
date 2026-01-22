import os from "node:os";
import { eq, getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  loadCookies,
  performLogin,
  saveCookies,
} from "../../../parsers/hh/auth";
import { HH_CONFIG } from "../../../parsers/hh/config";
import { parseResumeExperience } from "../../../parsers/hh/resume-parser";
import { extractTelegramUsername } from "../../../services/messaging";
import {
  updateResponseDetails,
  uploadCandidatePhoto,
  uploadResumePdf,
} from "../../../services/response";
import { refreshAllResumesChannel } from "../../channels/client";
import { inngest } from "../../client";

puppeteer.use(StealthPlugin());

// Configure Crawlee storage to use temp directory
process.env.CRAWLEE_STORAGE_DIR = os.tmpdir();

async function setupBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: HH_CONFIG.puppeteer.headless,
    args: HH_CONFIG.puppeteer.args,
    ignoreDefaultArgs: HH_CONFIG.puppeteer.ignoreDefaultArgs,
    slowMo: HH_CONFIG.puppeteer.slowMo,
  });
}

async function setupPage(
  browser: Browser,
  savedCookies: Parameters<Page["setCookie"]> | null,
): Promise<Page> {
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
  });

  if (savedCookies) {
    await page.setCookie(...savedCookies);
  }

  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  return page;
}

async function checkAndPerformLogin(
  page: Page,
  email: string,
  password: string,
  workspaceId: string,
): Promise<void> {
  const isLoggedIn = await performLogin(page, email, password, workspaceId);

  if (isLoggedIn) {
    const cookies = await page.cookies();
    await saveCookies("hh", workspaceId, cookies);
  } else {
    throw new Error("Не удалось войти в аккаунт HH.ru");
  }
}

/**
 * Inngest функция для обновления резюме всех откликов вакансии
 */
export const refreshAllResumesFunction = inngest.createFunction(
  {
    id: "refresh-all-resumes",
    name: "Refresh All Resumes",
  },
  { event: "response/resume.refresh.all" },
  async ({ event, step, publish }) => {
    const { vacancyId } = event.data;

    // Отправляем уведомление о начале
    await publish(
      refreshAllResumesChannel(vacancyId).progress({
        vacancyId,
        status: "started",
        message: "Начинаем обновление резюме всех откликов",
        total: 0,
        processed: 0,
        failed: 0,
      }),
    );

    const responsesData = await step.run("fetch-responses", async () => {
      console.log(`🚀 Запуск обновления резюме для всех откликов вакансии: ${vacancyId}`);

      const responses = await db.query.response.findMany({
        where: eq(response.entityId, vacancyId),
        columns: {
          id: true,
          entityId: true,
          resumeId: true,
          resumeUrl: true,
          candidateName: true,
        },
      });

      if (responses.length === 0) {
        throw new Error(`Отклики для вакансии ${vacancyId} не найдены`);
      }

      // Получаем vacancy отдельно
      const vacancy = await db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, vacancyId),
        columns: {
          workspaceId: true,
        },
      });

      if (!vacancy?.workspaceId) {
        throw new Error(`WorkspaceId не найден для вакансии ${vacancyId}`);
      }

      return { responses, vacancy };
    });

    const credentials = await step.run("get-credentials", async () => {
      const creds = await getIntegrationCredentials(
        db,
        "hh",
        responsesData.vacancy.workspaceId,
      );
      if (!creds?.email || !creds?.password) {
        throw new Error("Не найдены учетные данные для HH.ru");
      }
      return creds;
    });

    // Отправляем уведомление о начале обработки
    await publish(
      refreshAllResumesChannel(vacancyId).progress({
        vacancyId,
        status: "processing",
        message: `Найдено ${responsesData.responses.length} откликов для обработки`,
        total: responsesData.responses.length,
        processed: 0,
        failed: 0,
      }),
    );

    let processed = 0;
    let failed = 0;

    // Обрабатываем каждый отклик
    for (const responseItem of responsesData.responses) {
      try {
        await step.run(`process-resume-${responseItem.id}`, async () => {
          const browser = await setupBrowser();

          try {
            const savedCookies = await loadCookies(
              "hh",
              responsesData.vacancy.workspaceId,
            );
            const page = await setupPage(browser, savedCookies);

            await checkAndPerformLogin(
              page,
              credentials.email,
              credentials.password,
              responsesData.vacancy.workspaceId,
            );

            console.log(`📊 Парсинг резюме: ${responseItem.candidateName}`);

            const experienceData = await parseResumeExperience(
              page,
              responseItem.resumeUrl ?? "",
              responseItem.candidateName ?? undefined,
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
                responseItem.resumeId ?? "",
              );
              if (result.success) {
                resumePdfFileId = result.data;
              }
            }

            let photoFileId: string | null = null;
            if (experienceData.photoBuffer && experienceData.photoMimeType) {
              console.log(
                `📸 Загрузка фото кандидата в S3 (размер: ${
                  experienceData.photoBuffer.length
                })`,
              );
              const result = await uploadCandidatePhoto(
                experienceData.photoBuffer,
                experienceData.photoMimeType,
                responseItem.id,
              );
              if (result.success) {
                photoFileId = result.data;
              }
            }

            // Обновляем данные отклика
            await updateResponseDetails(responseItem.id, {
              experience: experienceData.experience,
              telegramUsername,
              resumePdfFileId,
              photoFileId,
              lastResumeUpdate: new Date(),
            });

            console.log(`✅ Резюме обновлено для кандидата: ${responseItem.candidateName}`);
          } finally {
            await browser.close();
          }
        });

        processed++;

        // Отправляем прогресс
        await publish(
          refreshAllResumesChannel(vacancyId).progress({
            vacancyId,
            status: "processing",
            message: `Обработано: ${processed}/${responsesData.responses.length}`,
            total: responsesData.responses.length,
            processed,
            failed,
          }),
        );
      } catch (error) {
        console.error(`❌ Ошибка обработки резюме для отклика ${responseItem.id}:`, error);
        failed++;

        // Продолжаем обработку остальных откликов
        await publish(
          refreshAllResumesChannel(vacancyId).progress({
            vacancyId,
            status: "processing",
            message: `Ошибка при обработке ${responseItem.candidateName}. Продолжаем...`,
            total: responsesData.responses.length,
            processed,
            failed,
          }),
        );
      }
    }

    // Отправляем финальный результат
    await publish(
      refreshAllResumesChannel(vacancyId).result({
        vacancyId,
        success: failed === 0,
        total: responsesData.responses.length,
        processed,
        failed,
      }),
    );

    return {
      success: failed === 0,
      total: responsesData.responses.length,
      processed,
      failed,
    };
  }
);