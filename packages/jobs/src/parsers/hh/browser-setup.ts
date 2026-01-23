import puppeteer, { type Browser, type Page } from "puppeteer";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { checkAndPerformLogin, loadCookies, saveCookies } from "./auth";
import { HH_CONFIG } from "./config";
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
  savedCookies: Parameters<Page["setCookie"]> | null,
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
    console.log(`🍪 Восстанавливаем ${savedCookies.length} cookies`);
    await page.setCookie(...savedCookies);
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
    const page = await setupPage(
      browser,
      savedCookies as Parameters<Page["setCookie"]> | null,
    );

    // Check login status and perform login if needed
    await checkAndPerformLogin(page, email, password, workspaceId);

    // Save cookies after login check/attempt
    const cookies = await page.cookies();
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
export async function ensureAuthenticated(
  page: Page,
  email: string,
  password: string,
  workspaceId: string,
): Promise<void> {
  // Check if we're on the login page
  const currentUrl = page.url();
  const isOnLoginPage =
    currentUrl.includes("/account/login") || currentUrl.includes("/login");

  if (isOnLoginPage) {
    await checkAndPerformLogin(page, email, password, workspaceId);
  } else {
    // Check if we need to login by looking for login elements
    const loginInput = await page.$('input[type="text"][name="username"]');
    if (loginInput) {
      await checkAndPerformLogin(page, email, password, workspaceId);
    }
  }
}

/**
 * Navigates to a URL while ensuring authentication
 */
export async function navigateWithAuth(
  page: Page,
  url: string,
  email: string,
  password: string,
  workspaceId: string,
): Promise<void> {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: HH_CONFIG.timeouts.navigation,
  });

  await page.waitForNetworkIdle({
    timeout: HH_CONFIG.timeouts.networkIdle,
  });

  // Ensure we're authenticated
  await ensureAuthenticated(page, email, password, workspaceId);
}
