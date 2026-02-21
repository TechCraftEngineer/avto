import {
  getAndClearHHPendingVerificationCode,
  getAndClearHHResendRequested,
  setIntegrationSetupStatus,
  upsertIntegration,
} from "@qbs-autonaim/db";
import { verifyHHCredentialsChannel } from "@qbs-autonaim/jobs/channels";
import type { CookieData } from "puppeteer";
import {
  resendVerificationCode,
  submitVerificationCode,
} from "../../../parsers/hh/core/auth/auth-2fa";
import { isCaptchaRequired } from "../../../parsers/hh/core/auth/auth-captcha";
import { closeBrowserSafely } from "../../../parsers/hh/core/browser/browser-utils";
import { saveCookies } from "../../../utils/cookies";
import { resolveCaptchaLoop } from "./captcha-handler";
import type { AuthContext, VerifyCredentialsStepResult } from "./types";

export async function handleCodeAuth(
  ctx: AuthContext,
  email: string,
  password: string | undefined,
  authType: "password" | "code",
): Promise<VerifyCredentialsStepResult> {
  const {
    page,
    browser,
    dbInstance,
    workspaceId,
    publish,
    sleep,
    pollTimeoutMs,
    pollIntervalMs,
  } = ctx;

  console.log(
    "🔐 Требуется 2FA — ждём код от пользователя в открытом браузере",
  );

  await setIntegrationSetupStatus(
    dbInstance,
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

  const startedAt = Date.now();
  while (Date.now() - startedAt < pollTimeoutMs) {
    const resendRequested = await getAndClearHHResendRequested(
      dbInstance,
      workspaceId,
    );
    if (resendRequested && page) {
      await resendVerificationCode(page);
    }

    const code = await getAndClearHHPendingVerificationCode(
      dbInstance,
      workspaceId,
    );
    if (code && page) {
      const codeResult = await submitVerificationCode(page, code);
      if (!codeResult.success) {
        let captchaCheck = false;
        try {
          captchaCheck = await isCaptchaRequired(page);
        } catch {
          captchaCheck = false;
        }
        if (captchaCheck) {
          await resolveCaptchaLoop(ctx);
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
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            cookies = await page.browserContext().cookies();
            break;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
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

        await upsertIntegration(dbInstance, {
          workspaceId,
          type: "hh",
          name: "HeadHunter",
          credentials:
            authType === "password" && password
              ? { email, password }
              : { email },
        });
        await saveCookies("hh", cookies, workspaceId);
        await setIntegrationSetupStatus(
          dbInstance,
          "hh",
          workspaceId,
          "completed",
        );

        await publish(
          verifyHHCredentialsChannel(workspaceId).result({
            success: true,
            isValid: true,
          }),
        );
        return { success: true, isValid: true };
      } catch (persistErr) {
        const errMsg =
          persistErr instanceof Error ? persistErr.message : String(persistErr);
        await publish(
          verifyHHCredentialsChannel(workspaceId).result({
            success: false,
            isValid: false,
            error: errMsg,
          }),
        );
        return {
          success: false,
          isValid: false,
          error: errMsg ?? "Ошибка сохранения интеграции",
        };
      } finally {
        await closeBrowserSafely(browser);
      }
    }
    await sleep(pollIntervalMs);
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
