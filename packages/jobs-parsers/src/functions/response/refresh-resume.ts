import os from "node:os";
import { eq, getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { refreshSingleResumeChannel } from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import { Log } from "crawlee";
import type { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  loadCookies,
  performLogin,
} from "../../parsers/hh/core/auth/auth";
import {
  setupBrowser,
  setupPage,
} from "../../parsers/hh/core/browser/browser-setup";
import { closeBrowserSafely } from "../../parsers/hh/core/browser/browser-utils";
import { HH_CONFIG } from "../../parsers/hh/core/config/config";
import { enrichResumeData } from "../../parsers/hh/services/resume-enrichment";

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
  async ({ event, step, publish, runId }) => {
    const { responseId } = event.data;

    // Отправляем уведомление о начале
    await publish(
      refreshSingleResumeChannel(responseId).progress({
        responseId,
        status: "started",
        message: "Начинаем обновление резюме",
      }),
    );

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

    // Отправляем уведомление о начале обработки
    await publish(
      refreshSingleResumeChannel(responseId).progress({
        responseId,
        status: "processing",
        message: `Обновление резюме ${responseData.candidateName || "кандидата"}`,
      }),
    );

    try {
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

          const result = await enrichResumeData({
            page,
            entityId: responseData.entityId,
            resumeId: responseData.resumeId ?? "",
            resumeUrl: responseData.resumeUrl ?? "",
            candidateName: responseData.candidateName ?? "",
            traceId: runId, // Используем runId из Inngest как traceId для Langfuse
          });

          if (!result.success) {
            throw new Error(`Ошибка обогащения резюме: ${result.error}`);
          }

          console.log(
            `✅ Резюме обновлено для: ${responseData.candidateName ?? "кандидата"}`,
          );
        } finally {
          await closeBrowserSafely(browser);
        }
      });

      // Отправляем успешный результат
      await publish(
        refreshSingleResumeChannel(responseId).result({
          responseId,
          success: true,
        }),
      );

      return {
        success: true,
        responseId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Отправляем ошибку
      await publish(
        refreshSingleResumeChannel(responseId).result({
          responseId,
          success: false,
          error: errorMessage,
        }),
      );

      throw error;
    }
  },
);
