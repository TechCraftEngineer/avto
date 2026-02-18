import { Log } from "crawlee";
import type { Page } from "puppeteer";
import {
  clearIntegrationAuthError,
  markIntegrationAuthError,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { loadCookies } from "../../../../utils/cookies";
import { HHAuthError } from "./auth-errors";
import { HH_CONFIG } from "../config/config";

export async function performLogin(
  page: Page,
  log: Log,
  email: string,
  password: string,
  _workspaceId: string,
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

  log.info("🔑 Проверка доступности авторизации по паролю...");
  const passwordButton = await page.$(
    'button[data-qa="expand-login-by_password"]',
  );

  if (!passwordButton) {
    throw new HHAuthError(
      "Авторизация по паролю недоступна для этого аккаунта. Для вашего аккаунта настроена только авторизация по коду. Пожалуйста, настройте авторизацию по паролю в настройках HH.ru или обновите данные интеграции",
      "PASSWORD_AUTH_UNAVAILABLE",
    );
  }

  log.info("🔑 Нажатие на кнопку 'Войти с паролем'...");
  await new Promise((r) => setTimeout(r, Math.random() * 1000 + 500));
  await page.click('button[data-qa="expand-login-by_password"]');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Проверяем, что поле пароля появилось
  let passwordField;
  try {
    passwordField = await page.waitForSelector(
      'input[type="password"][name="password"]',
      {
        visible: false,
        timeout: 10000,
      },
    );
  } catch {
    throw new HHAuthError(
      "Не удалось найти поле для ввода пароля. Возможно, для вашего аккаунта доступна только авторизация по коду",
      "PASSWORD_AUTH_UNAVAILABLE",
    );
  }

  if (!passwordField) {
    throw new HHAuthError(
      "Не удалось найти поле для ввода пароля. Возможно, для вашего аккаунта доступна только авторизация по коду",
      "PASSWORD_AUTH_UNAVAILABLE",
    );
  }

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
    throw new HHAuthError(
      `Не удалось войти в систему HH.ru. Проверьте правильность email и пароля в настройках интеграции. URL: ${currentUrl}`,
      "LOGIN_FAILED",
    );
  }

  log.info("✅ Авторизация выполнена!");
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
  let loginAttempted = false;

  try {
    console.log("🔐 Проверка авторизации...");

    // Проверяем авторизацию через главную страницу
    await page.goto(HH_CONFIG.urls.baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    // Проверяем наличие формы регистрации - если есть, значит не авторизованы
    const signupForm = await page.$('form[data-qa="account-signup"]');
    
    if (signupForm) {
      console.log("🔑 Требуется авторизация, выполняем логин...");
      loginAttempted = true;

      // Проверяем, есть ли у нас пароль (вход был по паролю)
      if (!password || password.trim() === "") {
        console.log(
          "❌ Авторизация слетела, но пароль отсутствует (вход был по коду)",
        );
        await markIntegrationAuthError(
          db,
          "hh",
          workspaceId,
          "Авторизация слетела, требуется повторная настройка (вход был по коду)",
        );
        return false;
      }

      const log = new Log();
      await performLogin(page, log, email, password, workspaceId);
      console.log("✅ Логин завершен");

      // После логина снова проверяем главную страницу
      await page.goto(HH_CONFIG.urls.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: HH_CONFIG.timeouts.navigation,
      });

      await page.waitForNetworkIdle({
        timeout: HH_CONFIG.timeouts.networkIdle,
      });

      const stillHasSignupForm = await page.$('form[data-qa="account-signup"]');
      
      if (stillHasSignupForm) {
        console.log("❌ Авторизация не удалась - форма регистрации все еще присутствует");
        await markIntegrationAuthError(
          db,
          "hh",
          workspaceId,
          "Не удалось войти в систему. Проверьте правильность email и пароля",
        );
        return false;
      }
    } else {
      console.log("✅ Уже авторизованы");
    }

    // Успешная авторизация - очищаем предыдущие ошибки если были
    console.log("✅ Авторизация успешна");
    await clearIntegrationAuthError(db, "hh", workspaceId);
    return true;
  } catch (error) {
    console.error("❌ Ошибка авторизации:", error);

    // Если была попытка логина и произошла ошибка - помечаем ошибку авторизации
    if (loginAttempted) {
      const errorMessage =
        error instanceof HHAuthError
          ? error.message
          : "Ошибка авторизации. Требуется повторная настройка интеграции";

      console.log("❌ Помечаем ошибку авторизации в интеграции");
      await markIntegrationAuthError(db, "hh", workspaceId, errorMessage);
    }

    return false;
  }
}

export { loadCookies };
export { HHAuthError, validateCredentials } from "./auth-errors";
