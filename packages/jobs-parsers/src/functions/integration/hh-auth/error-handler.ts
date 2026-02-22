import { setIntegrationSetupStatus } from "@qbs-autonaim/db";
import type { db } from "@qbs-autonaim/db/client";
import {
  verifyHHCredentialsChannel,
  workspaceNotificationsChannel,
} from "@qbs-autonaim/jobs/channels";
import type { PublishFn, VerifyCredentialsStepResult } from "./types";

export async function handleAuthError(
  error: unknown,
  workspaceId: string,
  publish: PublishFn,
  dbInstance: typeof db,
): Promise<VerifyCredentialsStepResult> {
  const errorMessage =
    error instanceof Error ? error.message : "Неизвестная ошибка";

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
        type: "api-error",
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

  const isCaptchaRelated =
    errorMessage.toLowerCase().includes("капча") ||
    errorMessage.toLowerCase().includes("captcha") ||
    /требуется\s*(.*\s+)?(капч|captcha)/i.test(errorMessage);

  if (isCaptchaRelated) {
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
