import {
  getAndClearHHPendingCaptcha,
  setIntegrationSetupStatus,
} from "@qbs-autonaim/db";
import { verifyHHCredentialsChannel } from "@qbs-autonaim/jobs/channels";
import {
  getCaptchaImageUrl,
  isCaptchaRequired,
  submitCaptcha,
} from "../../../parsers/hh/core/auth/auth-captcha";
import type { AuthContext } from "./types";

export async function resolveCaptchaLoop(ctx: AuthContext): Promise<void> {
  const {
    page,
    dbInstance,
    workspaceId,
    publish,
    sleep,
    pollTimeoutMs,
    pollIntervalMs,
  } = ctx;
  const startedAt = Date.now();

  while (Date.now() - startedAt < pollTimeoutMs) {
    if (!(await isCaptchaRequired(page))) return;

    const imageUrl = await getCaptchaImageUrl(page);
    if (!imageUrl) {
      await sleep(pollIntervalMs);
      continue;
    }

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

    const captchaTimeout = startedAt + pollTimeoutMs;
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
      const freshImageUrl = await getCaptchaImageUrl(page);
      await publish(
        verifyHHCredentialsChannel(workspaceId).result({
          success: false,
          isValid: false,
          captchaRequired: true,
          captchaImageUrl: freshImageUrl ?? imageUrl,
          message: result.error,
        }),
      );
    }
    await sleep(pollIntervalMs);
  }
}
