import { setIntegrationSetupStatus, upsertIntegration } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  createKworkApiClient,
  extractTokenFromSignInResponse,
  KWORK_ERROR_CODES,
  signIn,
} from "@qbs-autonaim/integration-clients";
import {
  verifyKworkCredentialsChannel,
  workspaceNotificationsChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";

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
        // Создаём интеграцию один раз в начале
        await upsertIntegration(db, {
          workspaceId,
          type: "kwork",
          name: "Kwork",
          credentials: { login, password },
        });

        const api = createKworkApiClient();
        const signInResult = await signIn(api, {
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
            // Обновляем только статус
            await setIntegrationSetupStatus(
              db,
              "kwork",
              workspaceId,
              "pending_captcha",
            );

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

        // Успешная авторизация — обновляем credentials с токеном
        const token = extractTokenFromSignInResponse(signInResult.data);
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

        // Успешная авторизация — статус completed
        await setIntegrationSetupStatus(db, "kwork", workspaceId, "completed");

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
