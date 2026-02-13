/**
 * Сервис обновления Kwork токена при истечении/невалидности.
 * При ошибке авторизации вызывает signIn с сохранёнными login/password,
 * сохраняет новый токен и повторяет запрос.
 * При неудачном signIn — публикует integration-error для уведомления пользователя.
 */
import type { DbClient } from "@qbs-autonaim/db";
import { getIntegrationCredentials, upsertIntegration } from "@qbs-autonaim/db";
import {
  type IntegrationErrorEvent,
  workspaceNotificationsChannel,
} from "../../inngest/channels/client";
import {
  extractTokenFromSignInResponse,
  isKworkAuthError,
  signIn,
  type KworkErrorResponse,
} from "@qbs-autonaim/integration-clients";

export interface KworkApiResult<T = unknown> {
  success: boolean;
  response?: T;
  error?: KworkErrorResponse;
  paging?: { page?: number; total?: number; pages?: number };
}

/**
 * Выполняет API-вызов Kwork с автоматическим обновлением токена при ошибке авторизации.
 * Если signIn не удаётся — публикует integration-error (когда publish передан) и выбрасывает ошибку.
 */
export async function executeWithKworkTokenRefresh<T>(
  db: DbClient,
  workspaceId: string,
  apiCall: (token: string) => Promise<KworkApiResult<T>>,
  options?: {
    publish?: (event: IntegrationErrorEvent) => Promise<unknown>;
  },
): Promise<KworkApiResult<T>> {
  let credentials = await getIntegrationCredentials(db, "kwork", workspaceId);
  if (!credentials) {
    return {
      success: false,
      error: {
        message:
          "Интеграция не настроена. Подключите интеграцию в настройках рабочего пространства.",
      },
    } as KworkApiResult<T>;
  }

  let token = credentials.token;
  let signInError: string | undefined;

  if (!token && credentials.login && credentials.password) {
    const signInResult = await signIn({
      login: credentials.login,
      password: credentials.password,
    });
    if (signInResult.success) {
      const newToken = extractTokenFromSignInResponse(signInResult.data);
      if (newToken) {
        token = newToken;
        await upsertIntegration(db, {
          workspaceId,
          type: "kwork",
          name: "Kwork",
          credentials: { ...credentials, token: newToken },
        });
      } else {
        signInError = "Токен не получен при авторизации";
      }
    } else {
      signInError =
        signInResult.error?.message ?? "Не удалось авторизоваться";
    }
  }

  if (!token) {
    const message =
      signInError ??
      (credentials.login && credentials.password
        ? "Токен истёк. Перейдите в настройки интеграций и повторно войдите в аккаунт."
        : "Интеграция не настроена. Подключите интеграцию в настройках рабочего пространства.");
    return {
      success: false,
      error: { message },
    } as KworkApiResult<T>;
  }

  const result = await apiCall(token);

  if (result.success) {
    return result;
  }

  if (!isKworkAuthError(result.error)) {
    return result;
  }

  const login = credentials.login;
  const password = credentials.password;
  if (!login || !password) {
    await notifyAuthFailed(workspaceId, options?.publish);
    throw new Error(
      "Токен Kwork истёк. Требуется повторная авторизация в настройках интеграции.",
    );
  }

  const signInResult = await signIn({ login, password });
  if (!signInResult.success) {
    await notifyAuthFailed(workspaceId, options?.publish);
    const errMsg =
      signInResult.error?.message ?? "Не удалось авторизоваться на Kwork";
    throw new Error(errMsg);
  }

  const newToken = extractTokenFromSignInResponse(signInResult.data);

  if (!newToken) {
    await notifyAuthFailed(workspaceId, options?.publish);
    throw new Error("signIn вернул успех, но токен не получен");
  }

  await upsertIntegration(db, {
    workspaceId,
    type: "kwork",
    name: "Kwork",
    credentials: {
      ...credentials,
      token: newToken,
    },
  });

  return apiCall(newToken);
}

async function notifyAuthFailed(
  workspaceId: string,
  publish?: (event: IntegrationErrorEvent) => Promise<unknown>,
): Promise<void> {
  if (!publish) return;

  const event = await workspaceNotificationsChannel(workspaceId)["integration-error"]({
    workspaceId,
    type: "kwork-auth-failed",
    message: "Не удалось обновить токен Kwork. Требуется повторная авторизация.",
    severity: "error",
    timestamp: new Date().toISOString(),
  });
  await publish(event);
}
