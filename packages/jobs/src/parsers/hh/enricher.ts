import os from "node:os";
import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";

import { Log } from "crawlee";
import type { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { extractTelegramUsername } from "../../services/messaging";
import {
  getResponsesWithoutDetails,
  updateResponseDetails,
  uploadResumePdf,
} from "../../services/response";
import { loadCookies, performLogin, saveCookies } from "./auth";
import { setupBrowser, setupPage } from "./browser-setup";
import { closeBrowserSafely } from "./browser-utils";
import { HH_CONFIG } from "./config";
import { parseResumeExperience } from "./resume-parser";

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

  // Сохраняем куки после успешной проверки/логина
  const cookies = await page.browserContext().cookies();
  await saveCookies("hh", cookies, workspaceId);
}

export async function runEnricher(workspaceId: string) {
  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("HH credentials не найдены в интеграциях");
  }

  const { email, password } = credentials;

  console.log("🚀 Запуск обогащения данных резюме...");

  // Получаем список откликов без деталей
  const responsesToEnrichResult = await getResponsesWithoutDetails();
  if (!responsesToEnrichResult.success) {
    throw new Error(responsesToEnrichResult.error);
  }
  const responsesToEnrich = responsesToEnrichResult.data;
  console.log(
    `📋 Найдено ${responsesToEnrich.length} откликов без детальной информации`,
  );

  if (responsesToEnrich.length === 0) {
    console.log("✅ Все отклики уже имеют детальную информацию");
    return;
  }

  const savedCookies = await loadCookies("hh", workspaceId);
  const browser = await setupBrowser();

  try {
    const page = await setupPage(browser, savedCookies);

    // Проверяем авторизацию
    await checkAndPerformLogin(page, email, password, workspaceId);

    console.log(`🚀 Начинаем обработку ${responsesToEnrich.length} резюме...`);

    // Последовательно обрабатываем каждое резюме
    for (let i = 0; i < responsesToEnrich.length; i++) {
      const resp = responsesToEnrich[i];
      if (!resp) continue;
      const { resumeId, entityId, candidateName, resumeUrl } = resp;

      try {
        // Добавляем случайную задержку между 3-5 секунд для имитации человеческого поведения
        const delay = Math.floor(Math.random() * 2000) + 3000;
        console.log(`⏳ Ожидание ${delay}ms перед обработкой...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        console.log(
          `📊 [${i + 1}/${responsesToEnrich.length}] Парсинг резюме: ${candidateName ?? ""}`,
        );

        const experienceData = await parseResumeExperience(
          page,
          resumeUrl ?? "",
        );

        // Extract Telegram username from contacts if available
        let telegramUsername: string | null = null;
        if (experienceData.contacts) {
          console.log(`🔍 Извлечение Telegram username из контактов...`);
          telegramUsername = await extractTelegramUsername(
            experienceData.contacts,
          );
          if (telegramUsername) {
            console.log(`✅ Найден Telegram username: @${telegramUsername}`);
          } else {
            console.log(`ℹ️ Telegram username не найден в контактах`);
          }
        }

        let resumePdfFileId: string | null = null;
        if (experienceData.pdfBuffer && resumeId) {
          const uploadResult = await uploadResumePdf(
            experienceData.pdfBuffer,
            resumeId,
          );
          if (uploadResult.success) {
            resumePdfFileId = uploadResult.data;
          }
        }

        const updateResult = await updateResponseDetails({
          vacancyId: entityId,
          resumeId: resumeId ?? "",
          resumeUrl: resumeUrl ?? "",
          candidateName: candidateName ?? "",
          experience: experienceData.experience || "",
          contacts: experienceData.contacts,
          phone: experienceData.phone,
          telegramUsername,
          resumePdfFileId,
        });

        if (!updateResult.success) {
          throw new Error(
            `Failed to update response details: ${updateResult.error}`,
          );
        }

        console.log(`✅ Данные обновлены для: ${candidateName ?? "кандидата"}`);
      } catch (error) {
        console.error(`❌ Ошибка парсинга для ${candidateName}: ${error}`);
        // Продолжаем обработку следующих резюме
      }
    }

    console.log("🎉 Обработка завершена!");
  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}
