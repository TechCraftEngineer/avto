import os from "node:os";
import { eq, getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  updateResponseDetails,
  uploadCandidatePhoto,
  uploadResumePdf,
} from "~/services/response";
import {
  checkAndPerformLogin,
  loadCookies,
} from "../../../parsers/hh/core/auth/auth";
import {
  setupBrowser,
  setupPage,
} from "../../../parsers/hh/core/browser/browser-setup";
import { closeBrowserSafely } from "../../../parsers/hh/core/browser/browser-utils";
import { parseResumeExperience } from "../../../parsers/hh/parsers/resume/resume-parser";
import { refreshAllResumesChannel } from "../../channels/client";
import { inngest } from "../../client";

puppeteer.use(StealthPlugin());

// Configure Crawlee storage to use temp directory
process.env.CRAWLEE_STORAGE_DIR = os.tmpdir();

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
      console.log(
        `🚀 Запуск обновления резюме для всех откликов вакансии: ${vacancyId}`,
      );

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
    const { email, password } = credentials;
    if (!email || !password) {
      throw new Error("Не найдены учетные данные для HH.ru");
    }

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

            console.log(
              `🔐 Проверка/выполнение логина для workspace: ${responsesData.vacancy.workspaceId}`,
            );

            const loginSucceeded = await checkAndPerformLogin(
              page,
              email,
              password,
              responsesData.vacancy.workspaceId,
            );

            if (!loginSucceeded) {
              console.error("❌ HH login failed", {
                workspaceId: responsesData.vacancy.workspaceId,
                maskedEmail: email
                  ? `${email.slice(0, 2)}***@${email.split("@")[1]}`
                  : undefined,
                responseId: responseItem.id,
                candidateName: responseItem.candidateName,
              });
              throw new Error(
                `HH login failed for workspace ${responsesData.vacancy.workspaceId}`,
              );
            }

            console.log(`📊 Парсинг резюме: ${responseItem.candidateName}`);

            const experienceData = await parseResumeExperience(
              page,
              responseItem.resumeUrl ?? "",
              responseItem.candidateName ?? "",
            );

            const telegramUsername = experienceData.contacts?.telegram;
            if (telegramUsername) {
              console.log(`✅ Найден Telegram username: @${telegramUsername}`);
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
            await updateResponseDetails({
              vacancyId: responseItem.entityId,
              resumeId: responseItem.resumeId ?? "",
              resumeUrl: responseItem.resumeUrl ?? "",
              candidateName: responseItem.candidateName ?? "",
              experience: JSON.stringify(experienceData.experience),
              contacts: experienceData.contacts,
              phone: experienceData.phone ?? null,
              telegramUsername,
              resumePdfFileId,
              photoFileId,
            });

            console.log(
              `✅ Резюме обновлено для кандидата: ${responseItem.candidateName}`,
            );
          } finally {
            await closeBrowserSafely(browser);
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
        console.error(
          `❌ Ошибка обработки резюме для отклика ${responseItem.id}:`,
          error,
        );
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
  },
);
