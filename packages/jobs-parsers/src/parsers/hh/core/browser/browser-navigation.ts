import type { Page } from "puppeteer";
import { checkAndPerformLogin } from "../auth/auth";
import { HH_CONFIG } from "../config/config";

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
