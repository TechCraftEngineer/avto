import {
  getAndClearHHPendingVerificationCode,
  upsertIntegration,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  verifyHHCredentialsChannel,
  workspaceNotificationsChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import { Log } from "crawlee";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";
import { performLogin } from "../../parsers/hh/core/auth/auth";
import {
  initiateCodeAuth,
  isWaitingForCode,
  submitVerificationCode,
} from "../../parsers/hh/core/auth/auth-2fa";
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

export const verifyHHCredentialsFunction = inngest.createFunction(
  {
    id: "integration-verify-hh-credentials",
    name: "Verify HH Credentials",
  },
  { event: "integration/verify-hh-credentials" },
  async ({ event, step, publish }) => {
    const eventData = event.data as {
      email: string;
      password: string;
      workspaceId: string;
      verificationCode?: string;
    };
    const { email, password, workspaceId } = eventData;

    // Код в первом событии не передаётся — его ждём через waitForEvent

    const POLL_INTERVAL_MS = 2000;
    const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 мин

    return await step.run("verify-credentials", async (): Promise<VerifyCredentialsStepResult> => {
      let browser: Browser | undefined;
      let page: Page | undefined;

      const sleep = (ms: number) =>
        new Promise<void>((resolve) => setTimeout(resolve, ms));

      try {
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

        const loginInput = await page.$('input[type="text"][name="username"]');

        if (loginInput) {
          const log = new Log();

          const initiated = await initiateCodeAuth(page, email);

          if (initiated) {
            const waitingForCode = await isWaitingForCode(page);

            if (waitingForCode) {
              console.log("🔐 Требуется 2FA — ждём код от пользователя в открытом браузере");

              await upsertIntegration(db, {
                workspaceId,
                type: "hh",
                name: "HeadHunter",
                credentials: { email },
              });

              await publish(
                verifyHHCredentialsChannel(workspaceId).result({
                  success: false,
                  isValid: false,
                  requiresTwoFactor: true,
                  twoFactorType: "email",
                  message: "Требуется ввод кода подтверждения",
                }),
              );

              // Не закрываем браузер — опрашиваем БД и вводим код в уже открытую форму
              const startedAt = Date.now();
              while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
                const code = await getAndClearHHPendingVerificationCode(
                  db,
                  workspaceId,
                );
                if (code && page) {
                  const codeResult = await submitVerificationCode(page, code);
                  if (!codeResult.success) {
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

                  const cookies = await page.browserContext().cookies();
                  await upsertIntegration(db, {
                    workspaceId,
                    type: "hh",
                    name: "HeadHunter",
                    credentials: { email, password },
                  });
                  await saveCookies("hh", cookies, workspaceId);

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
          }

          await page.goto(HH_CONFIG.urls.login, {
            waitUntil: "domcontentloaded",
            timeout: HH_CONFIG.timeouts.navigation,
          });

          await performLogin(page, log, email, password, workspaceId, false);
        } else {
          console.log("✅ Уже авторизованы");
        }

        const cookies = await page.browserContext().cookies();

        await upsertIntegration(db, {
          workspaceId,
          type: "hh",
          name: "HeadHunter",
          credentials: { email, password },
        });

        await saveCookies("hh", cookies, workspaceId);

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

        if (
          errorMessage.includes("капча") ||
          errorMessage.includes("captcha") ||
          errorMessage.includes("требуется")
        ) {
          await upsertIntegration(db, {
            workspaceId,
            type: "hh",
            name: "HeadHunter",
            credentials: { email },
          });

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
    });
  },
);
