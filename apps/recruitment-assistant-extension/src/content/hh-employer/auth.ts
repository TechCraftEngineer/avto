/**
 * Получение токена и workspace для API-запросов
 */

import { getExtensionApiUrl } from "../../config";

export interface AuthContext {
  token: string;
  workspaceId: string;
}

export type AuthError = "no-token" | "no-workspace" | "no-workspaces";

export interface AuthResult {
  ok: true;
  context: AuthContext;
}

export interface AuthErrorResult {
  ok: false;
  error: AuthError;
  message: string;
}

export type ResolveAuthResult = AuthResult | AuthErrorResult;

/**
 * Получает token и workspaceId из storage или API.
 * Сохраняет workspaceId в storage при первом запросе.
 */
export async function resolveAuth(): Promise<ResolveAuthResult> {
  const { authToken, userData } = await chrome.storage.local.get([
    "authToken",
    "userData",
  ]);
  const token = authToken as string | undefined;
  const user = userData as { organizationId?: string } | undefined;
  let workspaceId = (userData as { workspaceId?: string })?.workspaceId as
    | string
    | undefined;

  if (!token) {
    return {
      ok: false,
      error: "no-token",
      message: "Войдите в систему через расширение",
    };
  }

  if (!workspaceId && user?.organizationId) {
    const workspacesResp = await chrome.runtime.sendMessage({
      type: "API_REQUEST",
      payload: {
        url: getExtensionApiUrl(
          `workspaces?organizationId=${encodeURIComponent(user.organizationId)}`,
        ),
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    if (
      workspacesResp?.success &&
      Array.isArray(workspacesResp.data) &&
      workspacesResp.data.length > 0
    ) {
      workspaceId = workspacesResp.data[0].id;
      await chrome.storage.local.set({ workspaceId });
    }
  }

  if (!workspaceId) {
    return {
      ok: false,
      error: "no-workspace",
      message: "Выберите workspace в настройках",
    };
  }

  return {
    ok: true,
    context: { token, workspaceId },
  };
}
