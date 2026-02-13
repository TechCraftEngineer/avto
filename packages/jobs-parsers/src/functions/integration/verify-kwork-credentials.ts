import { upsertIntegration } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  verifyKworkCredentialsChannel,
  workspaceNotificationsChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import { KWORK_ERROR_CODES, signIn } from "../../parsers/kwork/core/api";

export const verifyKworkCredentialsFunction = inngest.createFunction(
  {
    id: "integration-verify-kwork-credentials",
    name: "Verify Kwork Credentials",
  },
  { event: "integration/verify-kwork-credentials" },
  async ({ event, step, publish }) => {
    const { login, password, workspaceId, gRecaptchaResponse } = event.data;

    const result = await step.run("verify-credentials", async () => {
      try {
        const signInResult = await signIn({
          login,
          password,
          ...(gRecaptchaResponse && {
            "g-recaptcha-response": gRecaptchaResponse,
          }),
        });

        if (!signInResult.success) {
          const error = signInResult.error;
          const errorCode = error?.code;
          const errorMessage = error?.message ?? "Неизвестная ошибка";

          // Код 118 — требуется капча, показать webview http://kwork.ru/captcha_only
          if (errorCode === KWORK_ERROR_CODES.CAPTCHA_REQUIRED) {
            const captchaResult = {
              success: false,
              isValid: false,
              error: "Требуется прохождение капчи",
              captchaRequired: true,
              recaptchaPassToken: error?.recaptcha_pass_token,
            };

            await publish(
              verifyKworkCredentialsChannel(workspaceId).result(captchaResult),
            );

            return captchaResult;
          }

          // Неверный логин или пароль
          const errorResult = {
            success: false,
            isValid: false,
            error:
              errorMessage.toLowerCase().includes("пароль") ||
              errorMessage.toLowerCase().includes("логин") ||
              errorMessage.toLowerCase().includes("login")
                ? "Неверный логин или пароль"
                : errorMessage,
          };

          await publish(
            verifyKworkCredentialsChannel(workspaceId).result(errorResult),
          );

          await publish(
            workspaceNotificationsChannel(workspaceId)["integration-error"]({
              workspaceId,
              type: "kwork-auth-failed",
              message: "Не удалось авторизоваться на Kwork",
              severity: "error",
              timestamp: new Date().toISOString(),
            }),
          );

          return errorResult;
        }

        // Успешная авторизация — сохраняем интеграцию с токеном
        const rawData = signInResult.data as
          | Record<string, unknown>
          | undefined;
        const innerData = rawData?.data as Record<string, unknown> | undefined;
        const token =
          (rawData?.token as string | undefined) ??
          (innerData?.token as string | undefined);
        const credentials: Record<string, string> = {
          login,
          password,
          ...(token && { token: String(token) }),
        };

        await upsertIntegration(db, {
          workspaceId,
          type: "kwork",
          name: "Kwork",
          credentials,
        });

        const successResult = {
          success: true,
          isValid: true,
        };

        await publish(
          verifyKworkCredentialsChannel(workspaceId).result(successResult),
        );

        console.log("✅ Kwork: учётные данные успешно проверены", {
          workspaceId,
        });

        return successResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Неизвестная ошибка";

        const unknownErrorResult = {
          success: false,
          isValid: false,
          error: errorMessage,
        };

        await publish(
          verifyKworkCredentialsChannel(workspaceId).result(unknownErrorResult),
        );

        await publish(
          workspaceNotificationsChannel(workspaceId)["integration-error"]({
            workspaceId,
            type: "api-error",
            message: `Ошибка при проверке учётных данных Kwork: ${errorMessage}`,
            severity: "error",
            timestamp: new Date().toISOString(),
          }),
        );

        throw error;
      }
    });

    return result;
  },
);
