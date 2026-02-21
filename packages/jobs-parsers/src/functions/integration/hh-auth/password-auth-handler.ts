import { HH_CONFIG } from "../../../parsers/hh/core/config/config";
import type { AuthContext } from "./types";
import { resolveCaptchaLoop } from "./captcha-handler";

export async function performPasswordLogin(
  ctx: AuthContext,
  email: string,
  password: string,
): Promise<void> {
  const { page, sleep } = ctx;

  await page.goto(HH_CONFIG.urls.login, {
    waitUntil: "domcontentloaded",
    timeout: HH_CONFIG.timeouts.navigation,
  });

  await page.waitForSelector('input[type="text"][name="username"]', {
    visible: true,
    timeout: 15000,
  });
  await page.click('input[type="text"][name="username"]', { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await sleep(Math.random() * 500 + 200);
  await page.type('input[type="text"][name="username"]', email, { delay: 100 });

  await page.waitForSelector('button[data-qa="expand-login-by_password"]', {
    visible: true,
    timeout: 10000,
  });
  await page.click('button[data-qa="expand-login-by_password"]');
  await sleep(2000);

  await page.waitForSelector('input[type="password"][name="password"]', {
    visible: true,
    timeout: 15000,
  });
  await page.type('input[type="password"][name="password"]', password, {
    delay: 100,
  });
  await sleep(Math.random() * 1000 + 500);
  await page.click('button[type="submit"]');
  await sleep(5000);

  await resolveCaptchaLoop(ctx);

  const loginUrl = page.url();
  if (
    loginUrl.includes("/account/login") ||
    loginUrl.includes("error") ||
    loginUrl.includes("failed")
  ) {
    throw new Error(`Логин не удался. Текущий URL: ${loginUrl}`);
  }
}
