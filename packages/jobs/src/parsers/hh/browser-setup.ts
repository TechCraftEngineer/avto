import puppeteer, { Browser, Page } from "puppeteer";
import { HH_CONFIG } from "../config";

/**
 * Launches a Puppeteer browser with HH-specific configuration
 */
export async function setupBrowser(): Promise<Browser> {
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
    await page.setCookie(...savedCookies);
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
): Promise<{ browser: Browser; page: Page; isLoggedIn: boolean }> {
  const { loadCookies, saveCookies, performLogin } = await import("./auth");
  const { checkAndPerformLogin } = await import("./login-checker");

  const savedCookies = await loadCookies("hh", workspaceId);
  const browser = await setupBrowser();

  try {
    const page = await setupPage(browser, savedCookies as Parameters<Page["setCookie"]> | null);

    // Check login status and perform login if needed
    const isLoggedIn = await checkAndPerformLogin(page, workspaceId);

    if (isLoggedIn) {
      // Save updated cookies after successful login
      const cookies = await page.cookies();
      await saveCookies("hh", cookies, workspaceId);
    }

    return { browser, page, isLoggedIn };
  } catch (error) {
    await browser.close();
    throw error;
  }
}