import { eq, getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";

import type { ProgressCallback } from "../../types";
import { validateCredentials } from "../core/auth/auth";
import {
  ensureAuthenticated,
  navigateWithAuth,
} from "../core/browser/browser-navigation";
import { setupAuthenticatedBrowser } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { HH_CONFIG } from "../core/config/config";
import { parseResponses } from "../parsers/response/response-parser";

/**
 * Parse only new responses for a specific vacancy
 * Does not parse the vacancy itself, only updates the response list
 */
export async function refreshVacancyResponses(
  vacancyId: string,
  workspaceId: string,
  onProgress?: ProgressCallback,
): Promise<{ newCount: number; totalResponses: number }> {
  console.log(`🔄 Refreshing responses for vacancy ${vacancyId}...`);

  // Get vacancy to retrieve externalId
  const vacancyData = await db.query.vacancy.findFirst({
    where: eq(vacancy.id, vacancyId),
  });

  if (!vacancyData) {
    throw new Error(`Вакансия ${vacancyId} не найдена`);
  }

  if (!vacancyData.externalId) {
    throw new Error(`У вакансии ${vacancyId} отсутствует externalId`);
  }

  // Get credentials
  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials) {
    throw new Error("HH credentials не найдены в интеграциях");
  }

  validateCredentials(credentials);

  const { email } = credentials;
  const password = credentials.password || "";

  // Setup authenticated browser with universal function
  const { browser, page } = await setupAuthenticatedBrowser(
    workspaceId,
    email!,
    password,
  );

  try {
    // Navigate to login page and check authentication
    console.log("🔗 Navigating to login page...");
    await page.goto(HH_CONFIG.urls.login, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    // Ensure authentication (will login if needed)
    await ensureAuthenticated(page, email!, password, workspaceId);

    // Navigate to responses page with auth check
    const responsesUrl = `https://hh.ru/employer/vacancyresponses?vacancyId=${vacancyData.externalId}&order=DATE`;
    await navigateWithAuth(page, responsesUrl, email!, password, workspaceId);

    // Получаем план workspace
    const workspaceData = await db.query.workspace.findFirst({
      where: (w, { eq }) => eq(w.id, workspaceId),
      columns: {
        plan: true,
      },
    });

    // Parse responses
    console.log(`📋 Parsing responses for vacancy ${vacancyId}...`);
    const result = await parseResponses(
      page,
      responsesUrl,
      vacancyData.externalId,
      vacancyId,
      onProgress,
      workspaceData?.plan,
    );

    console.log(`✅ Responses for vacancy ${vacancyId} updated successfully`);
    console.log(`📊 New responses: ${result.newCount}`);
    console.log(`📊 Total responses: ${result.totalResponses}`);

    await new Promise((resolve) =>
      setTimeout(resolve, HH_CONFIG.delays.afterParsing),
    );

    console.log("\n✨ Response refresh completed!");

    return {
      newCount: result.newCount,
      totalResponses: result.totalResponses,
    };
  } catch (error) {
    console.error("❌ Error refreshing responses:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}
