import { Log } from "crawlee";
import type { Page } from "puppeteer";
import { loadCookies, saveCookies } from "../../utils/cookies";
import { HH_CONFIG } from "./config";

export async function performLogin(
  page: Page,
  log: Log,
  email: string,
  password: string,
  workspaceId: string,
  saveCookiesAfterLogin = true,
) {
  log.info("🔍 Поиск поля email...");
  await page.waitForSelector('input[type="text"][name="username"]', {
    visible: false,
    timeout: 15000,
  });

  log.info("✍️  Заполнение email...");
  await page.click('input[type="text"][name="username"]', {
    clickCount: 3,
  });
  await page.keyboard.press("Backspace");
  await new Promise((r) => setTimeout(r, Math.random() * 500 + 200));
  await page.type('input[type="text"][name="username"]', email, {
    delay: 100,
  });

  log.info("🔑 Нажатие на кнопку 'Войти с паролем'...");
  await page.waitForSelector('button[data-qa="expand-login-by_password"]', {
    visible: false,
    timeout: 10000,
  });
  await new Promise((r) => setTimeout(r, Math.random() * 1000 + 500));
  await page.click('button[data-qa="expand-login-by_password"]');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  await page.waitForSelector('input[type="password"][name="password"]', {
    visible: false,
  });
  log.info("🔒 Заполнение пароля...");
  await page.type('input[type="password"][name="password"]', password, {
    delay: 100,
  });

  await new Promise((r) => setTimeout(r, Math.random() * 1000 + 500));
  log.info("📤 Отправка формы...");

  await page.click('button[type="submit"]');

  log.info("⏳ Ждем 2 минуты для ввода капчи (если есть)...");
  try {
    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 120000,
    });
  } catch (_e) {
    log.info(
      "⚠️ Тайм-аут ожидания навигации. Проверяем, прошли ли мы дальше...",
    );
  }

  // Проверяем, не остались ли мы на странице логина
  const currentUrl = page.url();
  log.info(`🌐 Текущий URL после попытки логина: ${currentUrl}`);

  // Если URL содержит ошибку или мы все еще на странице логина - логин не удался
  if (
    currentUrl.includes("/account/login") ||
    currentUrl.includes("error") ||
    currentUrl.includes("failed")
  ) {
    throw new Error(`Логин не удался. Текущий URL: ${currentUrl}`);
  }

  log.info("✅ Авторизация выполнена!");

  if (saveCookiesAfterLogin) {
    const cookies = await page.browser().cookies();
    log.info(`🍪 Получено ${cookies.length} cookies`);
    await saveCookies("hh", cookies, workspaceId);
  }
}

/**
 * Check if user is authenticated and perform login if needed
 */
export async function checkAndPerformLogin(
  page: Page,
  email: string,
  password: string,
  workspaceId: string,
): Promise<boolean> {
  try {
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
      console.log("🔑 Требуется авторизация, выполняем логин...");
      const log = new Log();
      await performLogin(page, log, email, password, workspaceId, false);
      console.log("✅ Логин завершен");
    } else {
      console.log("✅ Уже авторизованы");
    }

    // Проверяем успешность после логина/проверки
    const currentUrl = page.url();
    const hasLoginInput = await page.$('input[type="text"][name="username"]');

    if (currentUrl.includes("/account/login") && hasLoginInput) {
      console.log("❌ Авторизация не удалась - остались на странице логина");
      return false;
    }

    // Save cookies after successful check/login
    const cookies = await page.cookies();
    await saveCookies("hh", cookies, workspaceId);
    console.log("✅ Авторизация успешна");
    return true;
  } catch (error) {
    console.error("❌ Ошибка авторизации:", error);
    return false;
  }
}

export { loadCookies, saveCookies };
