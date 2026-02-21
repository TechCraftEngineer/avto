import { setIntegrationSetupStatus, upsertIntegration } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { verifyHHCredentialsChannel } from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";
import {
  initiateCodeAuth,
  isWaitingForCode,
} from "../../parsers/hh/core/auth/auth-2fa";
import { closeBrowserSafely } from "../../parsers/hh/core/browser/browser-utils";
import { HH_CONFIG } from "../../parsers/hh/core/config/config";
import { saveCookies } from "../../utils/cookies";
import { resolveCaptchaLoop } from "./hh-auth/captcha-handler";
import { handleCodeAuth } from "./hh-auth/code-auth-handler";
import { handleAuthError } from "./hh-auth/error-handler";
import { performPasswordLogin } from "./hh-auth/password-auth-handler";
import type {
  AuthContext,
  AuthEventData,
  VerifyCredentialsStepResult,
} from "./hh-auth/types";

export const verifyHHCredentialsFunction = inngest.createFunction(
  {
    id: "integration-verify-hh-credentials",
    name: "Verify HH Credentials",
  },
  { event: "integration/verify-hh-credentials" },
  async ({ event, step, publish }) => {
    const eventData = event.data as AuthEventData;
    const { email, password, workspaceId, authType = "password" } = eventData;

    const POLL_INTERVAL_MS = 2000;
    const POLL_TIMEOUT_MS = 10 * 60 * 1000;

    return await step.run(
      "verify-credentials",
      async (): Promise<VerifyCredentialsStepResult> => {
        let browser: Browser | undefined;
        let page: Page | undefined;

        const sleep = (ms: number) =>
          new Promise<void>((resolve) => setTimeout(resolve, ms));

        try {
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

          const ctx: AuthContext = {
            page,
            browser,
            dbInstance: db,
            workspaceId,
            publish,
            sleep,
            pollTimeoutMs: POLL_TIMEOUT_MS,
            pollIntervalMs: POLL_INTERVAL_MS,
          };

          const loginInput = await page.$(
            'input[type="text"][name="username"]',
          );

          if (loginInput) {
            const shouldUsePasswordAuth = authType === "password" && !!password;
            const initiated = shouldUsePasswordAuth
              ? false
              : await initiateCodeAuth(page, email);

            await resolveCaptchaLoop(ctx);

            let waitingForCode = await isWaitingForCode(page);

            if (!initiated && !waitingForCode) {
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
              return await handleCodeAuth(ctx, email, password, authType);
            }

            if (authType !== "password" || !password) {
              await closeBrowserSafely(browser);
              throw new Error(
                "Вход по паролю недоступен: пароль не передан (используйте тип «Вход по паролю»).",
              );
            }

            await performPasswordLogin(ctx, email, password);
          } else {
            console.log("✅ Уже авторизованы");
          }

          const cookies = await page.browserContext().cookies();

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
          return await handleAuthError(error, workspaceId, publish, db);
        }
      },
    );
  },
);
