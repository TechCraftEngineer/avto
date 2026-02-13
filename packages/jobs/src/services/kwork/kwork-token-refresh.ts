/**
 * Сервис обновления Kwork токена при истечении/невалидности.
 * При ошибке авторизации вызывает signIn с сохранёнными login/password,
 * сохраняет новый токен и повторяет запрос.
 * При неудачном signIn — публикует integration-error для уведомления пользователя.
 */
import type { DbClient } from "@qbs-autonaim/db";
import { getIntegrationCredentials, upsertIntegration } from "@qbs-autonaim/db";
import { workspaceNotificationsChannel } from "../../inngest/channels/client";
import {
  isKworkAuthError,
  signIn,
  type KworkErrorResponse,
} from "@qbs-autonaim/jobs-parsers";

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
    publish?: (event: object) => Promise<void>;
  },
): Promise<KworkApiResult<T>> {
  const credentials = await getIntegrationCredentials(db, "kwork", workspaceId);
  if (!credentials?.token) {
    return {
      success: false,
      error: { message: "Kwork интеграция не настроена или отсутствует токен" },
    } as KworkApiResult<T>;
  }

  const result = await apiCall(credentials.token);

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

  const rawData = signInResult.data as Record<string, unknown> | undefined;
  const innerData = rawData?.data as Record<string, unknown> | undefined;
  const newToken =
    (rawData?.token as string | undefined) ??
    (innerData?.token as string | undefined);

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
  publish?: (event: object) => Promise<void>,
): Promise<void> {
  if (!publish) return;

  await publish(
    workspaceNotificationsChannel(workspaceId)["integration-error"]({
      workspaceId,
      type: "kwork-auth-failed",
      message: "Не удалось обновить токен Kwork. Требуется повторная авторизация.",
      severity: "error",
      timestamp: new Date().toISOString(),
    }),
  );
}
