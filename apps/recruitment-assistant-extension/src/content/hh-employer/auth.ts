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
 * При отсутствии выбора автоматически выбирает первую организацию и workspace.
 */
export async function resolveAuth(): Promise<ResolveAuthResult> {
  const { authToken, userData, workspaceId: storedWorkspaceId } =
    await chrome.storage.local.get(["authToken", "userData", "workspaceId"]);
  const token = authToken as string | undefined;
  const user = userData as { organizationId?: string; workspaceId?: string } | undefined;
  let organizationId = user?.organizationId;
  let workspaceId = (storedWorkspaceId as string | undefined) ?? user?.workspaceId;

  if (!token) {
    return {
      ok: false,
      error: "no-token",
      message: "Войдите в систему через расширение",
    };
  }

  // Если нет организации — загружаем список и выбираем первую
  if (!organizationId) {
    const orgsResp = await chrome.runtime.sendMessage({
      type: "API_REQUEST",
      payload: {
        url: getExtensionApiUrl("organizations"),
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    if (
      orgsResp?.success &&
      Array.isArray(orgsResp.data) &&
      orgsResp.data.length > 0
    ) {
      organizationId = (orgsResp.data[0] as { id: string }).id;
      await chrome.storage.local.set({
        userData: { ...user, organizationId },
      });
    }
  }

  // Если нет workspace — загружаем по организации и выбираем первый
  if (!workspaceId && organizationId) {
    const workspacesResp = await chrome.runtime.sendMessage({
      type: "API_REQUEST",
      payload: {
        url: getExtensionApiUrl(
          `workspaces?organizationId=${encodeURIComponent(organizationId)}`,
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
      workspaceId = (workspacesResp.data[0] as { id: string }).id;
      await chrome.storage.local.set({ workspaceId });
    }
  }

  if (!workspaceId) {
    return {
      ok: false,
      error: "no-workspace",
      message: "Выберите рабочее пространство в настройках",
    };
  }

  return {
    ok: true,
    context: { token, workspaceId },
  };
}
