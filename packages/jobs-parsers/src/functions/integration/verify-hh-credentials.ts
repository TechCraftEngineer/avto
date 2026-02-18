import {
  getAndClearHHPendingCaptcha,
  getAndClearHHPendingVerificationCode,
  getAndClearHHResendRequested,
  setIntegrationSetupStatus,
  upsertIntegration,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  verifyHHCredentialsChannel,
  workspaceNotificationsChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import type { Browser, CookieData, Page } from "puppeteer";
import puppeteer from "puppeteer";
import {
  initiateCodeAuth,
  isWaitingForCode,
  resendVerificationCode,
  submitVerificationCode,
} from "../../parsers/hh/core/auth/auth-2fa";
import {
  getCaptchaImageUrl,
  isCaptchaRequired,
  submitCaptcha,
} from "../../parsers/hh/core/auth/auth-captcha";
import { closeBrowserSafely } from "../../parsers/hh/core/browser/browser-utils";
import { HH_CONFIG } from "../../parsers/hh/core/config/config";
import { saveCookies } from "../../utils/cookies";

/**
 * Тип результата проверки 2FA
 */
export interface TwoFactorRequiredResult {
  success: boolean;
  isValid: boolean;
  requiresTwoFactor: boolean;
  twoFactorType?: "email" | "phone";
  message?: string;
}

/**
 * Результат проверки кода 2FA
 */
export interface TwoFactorCodeResult {
  success: boolean;
  isValid: boolean;
  error?: string;
}

/** Результат шага verify-credentials */
type VerifyCredentialsStepResult =
  | { success: true; isValid: true }
  | { success: false; isValid: false; requiresTwoFactor: true }
  | { success: false; isValid: false; error: string };

// biome-ignore lint/suspicious/noExplicitAny: compatible with Inngest Realtime PublishFn which expects Input
type PublishFn = (event: any) => Promise<unknown>;

/**
 * Опрашивает капчу, если она появилась: публикует URL на фронт, ждёт ввод, вводит в Puppeteer
 */
async function resolveCaptchaLoop(
  page: Page,
  dbInstance: typeof db,
  workspaceId: string,
  publish: PublishFn,
  sleep: (ms: number) => Promise<void>,
  timeoutMs: number,
  pollIntervalMs: number,
  email?: string,
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!(await isCaptchaRequired(page))) return;

    const imageUrl = await getCaptchaImageUrl(page);
    if (!imageUrl) {
      await sleep(pollIntervalMs);
      continue;
    }

    // Обновляем только статус, интеграция уже создана
    await setIntegrationSetupStatus(
      dbInstance,
      "hh",
      workspaceId,
      "pending_captcha",
    );

    await publish(
      verifyHHCredentialsChannel(workspaceId).result({
        success: false,
        isValid: false,
        captchaRequired: true,
        captchaImageUrl: imageUrl,
        message: "Введите символы с картинки",
      }),
    );

    const captchaTimeout = Date.now() + timeoutMs - (Date.now() - startedAt);
    let captchaText: string | null = null;
    while (Date.now() < captchaTimeout) {
      captchaText = await getAndClearHHPendingCaptcha(dbInstance, workspaceId);
      if (captchaText) break;
      await sleep(pollIntervalMs);
    }

    if (!captchaText) {
      await publish(
        verifyHHCredentialsChannel(workspaceId).result({
          success: false,
          isValid: false,
          error: "Время ввода капчи истекло",
        }),
      );
      throw new Error("Время ввода капчи истекло");
    }

    const result = await submitCaptcha(page, captchaText);
    if (result.success) return;
    if (result.error?.includes("Неверная")) {
      await publish(
        verifyHHCredentialsChannel(workspaceId).result({
          success: false,
          isValid: false,
          captchaRequired: true,
          captchaImageUrl: imageUrl,
          message: result.error,
        }),
      );
    }
    await sleep(1000);
  }
}

export const verifyHHCredentialsFunction = inngest.createFunction(
  {
    id: "integration-verify-hh-credentials",
    name: "Verify HH Credentials",
  },
  { event: "integration/verify-hh-credentials" },
  async ({ event, step, publish }) => {
    const eventData = event.data as {
      email: string;
      password?: string;
      workspaceId: string;
      authType?: "password" | "code";
      verificationCode?: string;
    };
    const {
      email,
      password,
      workspaceId,
      authType = "password",
    } = eventData;

    // Код в первом событии не передаётся — его ждём через waitForEvent

    const POLL_INTERVAL_MS = 2000;
    const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 мин

    return await step.run(
      "verify-credentials",
      async (): Promise<VerifyCredentialsStepResult> => {
        let browser: Browser | undefined;
        let page: Page | undefined;

        const sleep = (ms: number) =>
          new Promise<void>((resolve) => setTimeout(resolve, ms));

        try {
          // Создаём интеграцию один раз в начале
          await upsertIntegration(db, {
            workspaceId,
            type: "hh",
            name: "HeadHunter",
            credentials: { email },
          });

          browser = await puppeteer.launch(HH_CONFIG.puppeteer);
          page = await browser.newPage();
          await page.setUserAgent({ userAgent: HH_CONFIG.userAgent });

          await page.goto(HH_CONFIG.urls.login, {
            waitUntil: "domcontentloaded",
            timeout: HH_CONFIG.timeouts.navigation,
          });

          await page.waitForNetworkIdle({
            timeout: HH_CONFIG.timeouts.networkIdle,
          });

          const loginInput = await page.$(
            'input[type="text"][name="username"]',
          );

          if (loginInput) {
            // При authType=password — сразу вход по паролю, не инициируем код
            const shouldUsePasswordAuth = authType === "password" && !!password;

            const initiated = shouldUsePasswordAuth
              ? false
              : await initiateCodeAuth(page, email);

            // Капча может появиться после нажатия «Получить код» или «Войти»
            await resolveCaptchaLoop(
              page,
              db,
              workspaceId,
              publish,
              sleep,
              POLL_TIMEOUT_MS,
              POLL_INTERVAL_MS,
              email,
            );

            let waitingForCode = await isWaitingForCode(page);

            if (!initiated && !waitingForCode) {
              // initiateCodeAuth вернул false — проверяем, доступен ли вход по паролю.
              // Для аккаунтов «только по коду» кнопки «Войти с паролем» нет.
              const passwordLoginAvailable = await page.$(
                'button[data-qa="expand-login-by_password"]',
              );
              if (authType === "code" && passwordLoginAvailable) {
                await publish(
                  verifyHHCredentialsChannel(workspaceId).result({
                    success: false,
                    isValid: false,
                    error:
                      "Для этого аккаунта требуется вход по паролю. Выберите «Вход по паролю».",
                  }),
                );
                await closeBrowserSafely(browser);
                return {
                  success: false,
                  isValid: false,
                  error: "Требуется вход по паролю",
                } as VerifyCredentialsStepResult;
              }
              if (!passwordLoginAvailable) {
                // Вход только по коду — поле кода могло появиться с задержкой
                await sleep(2000);
                waitingForCode = await isWaitingForCode(page);
                if (!waitingForCode) {
                  await setIntegrationSetupStatus(
                    db,
                    "hh",
                    workspaceId,
                    "pending_verification",
                  );
                  await publish(
                    verifyHHCredentialsChannel(workspaceId).result({
                      success: false,
                      isValid: false,
                      requiresTwoFactor: true,
                      twoFactorType: "email",
                      message: "Вход только по коду. Введите код из письма.",
                    }),
                  );
                  await closeBrowserSafely(browser);
                  return {
                    success: false,
                    isValid: false,
                    requiresTwoFactor: true,
                  } as VerifyCredentialsStepResult;
                }
              }
            }

            if (waitingForCode) {
              console.log(
                "🔐 Требуется 2FA — ждём код от пользователя в открытом браузере",
              );

              await setIntegrationSetupStatus(
                db,
                "hh",
                workspaceId,
                "pending_verification",
              );

              await publish(
                verifyHHCredentialsChannel(workspaceId).result({
                  success: false,
                  isValid: false,
                  requiresTwoFactor: true,
                  twoFactorType: "email",
                  message: "Требуется ввод кода подтверждения",
                }),
              );

              // Не закрываем браузер — опрашиваем БД: resend или код
              const startedAt = Date.now();
              while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
                const resendRequested = await getAndClearHHResendRequested(
                  db,
                  workspaceId,
                );
                if (resendRequested && page) {
                  await resendVerificationCode(page);
                }

                const code = await getAndClearHHPendingVerificationCode(
                  db,
                  workspaceId,
                );
                if (code && page) {
                  const codeResult = await submitVerificationCode(page, code);
                  if (!codeResult.success) {
                    // После ввода кода могла появиться капча
                    let captchaCheck = false;
                    try {
                      captchaCheck = await isCaptchaRequired(page);
                    } catch {
                      // Execution context destroyed — страница могла перейти
                      captchaCheck = false;
                    }
                    if (captchaCheck) {
                      await resolveCaptchaLoop(
                        page,
                        db,
                        workspaceId,
                        publish,
                        sleep,
                        POLL_TIMEOUT_MS,
                        POLL_INTERVAL_MS,
                        email,
                      );
                      continue;
                    }
                    await closeBrowserSafely(browser);
                    await publish(
                      verifyHHCredentialsChannel(workspaceId).result({
                        success: false,
                        isValid: false,
                        error: codeResult.error,
                      }),
                    );
                    return {
                      success: false,
                      isValid: false,
                      error: codeResult.error ?? "Ошибка ввода кода",
                    };
                  }

                  let cookies: CookieData[] = [];
                  for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                      cookies = await page.browserContext().cookies();
                      break;
                    } catch (err) {
                      const msg =
                        err instanceof Error ? err.message : String(err);
                      if (
                        msg.includes("Execution context was destroyed") &&
                        attempt < 2
                      ) {
                        await sleep(2000 * (attempt + 1));
                        continue;
                      }
                      throw err;
                    }
                  }
                  
                  // Обновляем credentials только при успешной авторизации
                  await upsertIntegration(db, {
                    workspaceId,
                    type: "hh",
                    name: "HeadHunter",
                    credentials:
                      authType === "password" && password
                        ? { email, password }
                        : { email },
                  });
                  await saveCookies("hh", cookies, workspaceId);

                  // Успешная авторизация — статус completed
                  await setIntegrationSetupStatus(
                    db,
                    "hh",
                    workspaceId,
                    "completed",
                  );

                  await closeBrowserSafely(browser);
                  await publish(
                    verifyHHCredentialsChannel(workspaceId).result({
                      success: true,
                      isValid: true,
                    }),
                  );
                  return { success: true, isValid: true };
                }
                await sleep(POLL_INTERVAL_MS);
              }

              await closeBrowserSafely(browser);
              await publish(
                verifyHHCredentialsChannel(workspaceId).result({
                  success: false,
                  isValid: false,
                  error: "Время ввода кода истекло. Запросите новый код.",
                }),
              );
              return {
                success: false,
                isValid: false,
                error: "Время ввода кода истекло",
              };
            }

            if (authType !== "password" || !password) {
              await closeBrowserSafely(browser);
              throw new Error(
                "Вход по паролю недоступен: пароль не передан (используйте тип «Вход по паролю»).",
              );
            }

            await page.goto(HH_CONFIG.urls.login, {
              waitUntil: "domcontentloaded",
              timeout: HH_CONFIG.timeouts.navigation,
            });

            await page.waitForSelector('input[type="text"][name="username"]', {
              visible: false,
              timeout: 15000,
            });
            await page.click('input[type="text"][name="username"]', {
              clickCount: 3,
            });
            await page.keyboard.press("Backspace");
            await sleep(Math.random() * 500 + 200);
            await page.type('input[type="text"][name="username"]', email, {
              delay: 100,
            });
            await page.waitForSelector(
              'button[data-qa="expand-login-by_password"]',
              { visible: false, timeout: 10000 },
            );
            await page.click('button[data-qa="expand-login-by_password"]');
            await sleep(2000);
            await page.waitForSelector(
              'input[type="password"][name="password"]',
              { visible: false },
            );
            await page.type(
              'input[type="password"][name="password"]',
              password,
              {
                delay: 100,
              },
            );
            await sleep(Math.random() * 1000 + 500);
            await page.click('button[type="submit"]');
            await sleep(5000);

            // Капча может появиться после нажатия «Войти»
            await resolveCaptchaLoop(
              page,
              db,
              workspaceId,
              publish,
              sleep,
              POLL_TIMEOUT_MS,
              POLL_INTERVAL_MS,
              email,
            );

            const loginUrl = page.url();
            if (
              loginUrl.includes("/account/login") ||
              loginUrl.includes("error") ||
              loginUrl.includes("failed")
            ) {
              throw new Error(`Логин не удался. Текущий URL: ${loginUrl}`);
            }
          } else {
            console.log("✅ Уже авторизованы");
          }

          const cookies = await page.browserContext().cookies();

          // Обновляем credentials только при успешной авторизации
          await upsertIntegration(db, {
            workspaceId,
            type: "hh",
            name: "HeadHunter",
            credentials:
              authType === "password" && password
                ? { email, password }
                : { email },
          });

          await saveCookies("hh", cookies, workspaceId);

          // Успешная авторизация — статус completed
          await setIntegrationSetupStatus(db, "hh", workspaceId, "completed");

          await closeBrowserSafely(browser);

          await publish(
            verifyHHCredentialsChannel(workspaceId).result({
              success: true,
              isValid: true,
            }),
          );

          return { success: true, isValid: true };
        } catch (error) {
          if (browser) {
            await closeBrowserSafely(browser);
          }

          const errorMessage =
            error instanceof Error ? error.message : "Неизвестная ошибка";

          // Проверяем, является ли ошибка таймаутом навигации
          const isNavigationTimeout =
            errorMessage.includes("Navigation timeout") ||
            errorMessage.includes("TimeoutError") ||
            (error instanceof Error && error.name === "TimeoutError");

          if (isNavigationTimeout) {
            console.warn(
              "⚠️ Таймаут навигации — это не ошибка авторизации, возможны проблемы с сетью или сайтом",
            );
            await publish(
              verifyHHCredentialsChannel(workspaceId).result({
                success: false,
                isValid: false,
                error:
                  "Не удалось загрузить страницу HeadHunter. Проверьте подключение к интернету и попробуйте снова.",
              }),
            );

            await publish(
              workspaceNotificationsChannel(workspaceId)["integration-error"]({
                workspaceId,
                type: "network-error",
                message: "Не удалось подключиться к HeadHunter",
                severity: "warning",
                timestamp: new Date().toISOString(),
              }),
            );

            return {
              success: false,
              isValid: false,
              error: "Не удалось загрузить страницу HeadHunter",
            };
          }

          if (
            errorMessage.includes("капча") ||
            errorMessage.includes("captcha") ||
            errorMessage.includes("требуется")
          ) {
            await setIntegrationSetupStatus(
              db,
              "hh",
              workspaceId,
              "pending_captcha",
            );

            await publish(
              verifyHHCredentialsChannel(workspaceId).result({
                success: false,
                isValid: false,
                requiresTwoFactor: true,
                message: errorMessage,
              }),
            );

            return {
              success: false,
              isValid: false,
              requiresTwoFactor: true,
            } as VerifyCredentialsStepResult;
          }

          if (
            errorMessage.includes("Неверный логин") ||
            errorMessage.includes("пароль") ||
            errorMessage.includes("login")
          ) {
            await publish(
              verifyHHCredentialsChannel(workspaceId).result({
                success: false,
                isValid: false,
                error: "Неверный логин или пароль",
              }),
            );

            await publish(
              workspaceNotificationsChannel(workspaceId)["integration-error"]({
                workspaceId,
                type: "hh-auth-failed",
                message: "Не удалось авторизоваться на HeadHunter",
                severity: "error",
                timestamp: new Date().toISOString(),
              }),
            );

            return {
              success: false,
              isValid: false,
              error: "Неверный логин или пароль",
            };
          }

          await publish(
            verifyHHCredentialsChannel(workspaceId).result({
              success: false,
              isValid: false,
              error: errorMessage,
            }),
          );

          await publish(
            workspaceNotificationsChannel(workspaceId)["integration-error"]({
              workspaceId,
              type: "api-error",
              message: `Ошибка при проверке учётных данных: ${errorMessage}`,
              severity: "error",
              timestamp: new Date().toISOString(),
            }),
          );

          throw error;
        }
      },
    );
  },
);
