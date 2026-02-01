import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import puppeteer, { type Browser, type CookieData, type Page } from "puppeteer";
import { checkAndPerformLogin, loadCookies, saveCookies } from "../auth/auth";
import { HH_CONFIG } from "../config/config";
import { closeBrowserSafely } from "./browser-utils";

/**
 * Cleans up temporary Puppeteer profiles to avoid EBUSY errors on Windows
 */
async function cleanupTempProfiles(): Promise<void> {
  try {
    const tempDir = os.tmpdir();
    const files = await fs.readdir(tempDir);

    // Find and remove puppeteer temp profiles
    const puppeteerProfilePattern = /^puppeteer_dev_chrome_profile-/;
    const cleanupPromises = files
      .filter((file) => puppeteerProfilePattern.test(file))
      .map(async (profileDir) => {
        const profilePath = path.join(tempDir, profileDir);
        try {
          // Try to remove the directory recursively
          await fs.rm(profilePath, { recursive: true, force: true });
          console.log(`🧹 Очищен временный профиль: ${profileDir}`);
        } catch (error) {
          // Ignore cleanup errors - directory might be in use
          console.warn(`⚠️ Не удалось очистить профиль ${profileDir}:`, error);
        }
      });

    await Promise.all(cleanupPromises);
  } catch (error) {
    // Ignore cleanup errors during setup
    console.warn("⚠️ Ошибка при очистке временных профилей:", error);
  }
}

/**
 * Launches a Puppeteer browser with HH-specific configuration
 */
export async function setupBrowser(): Promise<Browser> {
  // Clean up temp profiles before launching new browser
  await cleanupTempProfiles();

  return await puppeteer.launch({
    headless: HH_CONFIG.puppeteer.headless,
    args: HH_CONFIG.puppeteer.args,
    ignoreDefaultArgs: HH_CONFIG.puppeteer.ignoreDefaultArgs,
    slowMo: HH_CONFIG.puppeteer.slowMo,
  });
}

/**
 * Sets up a page with anti-detection measures and cookie restoration
 */
export async function setupPage(
  browser: Browser,
  savedCookies: CookieData[] | null,
): Promise<Page> {
  const page = await browser.newPage();

  // Anti-detection patches
  await page.evaluateOnNewDocument(() => {
    // Hide webdriver property
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });

    // Mock plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    // Set realistic languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["ru-RU", "ru", "en-US", "en"],
    });

    // Mock Chrome runtime
    (window as { chrome?: unknown }).chrome = {
      runtime: {},
    };

    // Override permissions query for notifications
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
          } as PermissionStatus)
        : originalQuery(parameters);
  });

  // Restore cookies if provided
  if (savedCookies && savedCookies.length > 0) {
    // Фильтруем cookies с обязательным domain для browserContext
    const validCookies = savedCookies.filter((cookie) => cookie.domain);
    if (validCookies.length > 0) {
      console.log(`🍪 Восстанавливаем ${validCookies.length} cookies`);
      await page.browserContext().setCookie(...(validCookies as CookieData[]));
    } else {
      console.log("🍪 Cookies не найдены, будет выполнен первичный логин");
    }
  } else {
    console.log("🍪 Cookies не найдены, будет выполнен первичный логин");
  }

  // Set viewport and user agent
  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent(HH_CONFIG.userAgent);

  return page;
}

/**
 * Sets up an authenticated browser with login check and cookie management
 */
export async function setupAuthenticatedBrowser(
  workspaceId: string,
  email: string,
  password: string,
): Promise<{
  browser: Browser;
  page: Page;
  credentials: { email: string; password: string };
}> {
  const savedCookies = await loadCookies("hh", workspaceId);
  const browser = await setupBrowser();

  try {
    const page = await setupPage(browser, savedCookies as CookieData[] | null);

    // Check login status and perform login if needed
    await checkAndPerformLogin(page, email, password, workspaceId);

    // Save cookies after login check/attempt
    const cookies = await page.browserContext().cookies();
    await saveCookies("hh", cookies, workspaceId);

    return { browser, page, credentials: { email, password } };
  } catch (error) {
    await closeBrowserSafely(browser);
    throw error;
  }
}

/**
 * Ensures the user is authenticated on the current page
 */

/**
 * Sets up a fully configured browser page with authentication
 */
export async function setupPageWithAuth(
  workspaceId: string,
  email: string,
  password: string,
): Promise<{ browser: Browser; page: Page }> {
  const savedCookies = await loadCookies("hh", workspaceId);
  const browser = await setupBrowser();

  try {
    const page = await setupPage(browser, savedCookies as CookieData[] | null);

    // Check authentication and perform login if needed
    const loggedIn = await checkAndPerformLogin(page, email, password, workspaceId);

    if (!loggedIn) {
      throw new Error("Не удалось войти в систему HeadHunter");
    }

    // Save cookies after successful login
    const cookies = await page.browserContext().cookies();
    const filteredCookies = cookies.filter((cookie) => cookie.domain);
    if (filteredCookies.length > 0) {
      await saveCookies("hh", filteredCookies, workspaceId);
    }

    return { browser, page };
  } catch (error) {
    await closeBrowserSafely(browser);
    throw error;
  }
}

