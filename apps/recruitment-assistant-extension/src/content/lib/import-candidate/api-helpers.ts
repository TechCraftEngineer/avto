/**
 * Вспомогательные функции для API запросов расширения
 */

export interface AuthStorage {
  authToken?: string;
  userData?: { organizationId?: string };
}

export async function getAuthFromStorage(): Promise<AuthStorage> {
  const result = await chrome.storage.local.get(["authToken", "userData"]);
  return {
    authToken: result.authToken as string | undefined,
    userData: result.userData as { organizationId?: string } | undefined,
  };
}

export interface ExtensionApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Отправляет API запрос через Service Worker расширения */
export async function sendExtensionApiRequest<T = unknown>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: Record<string, unknown>;
    token: string;
  },
): Promise<ExtensionApiResponse<T>> {
  const { getExtensionApiUrl } = await import("../../../config");
  const { method = "POST", body, token } = options;

  const resp = await chrome.runtime.sendMessage({
    type: "API_REQUEST",
    payload: {
      url: getExtensionApiUrl(endpoint),
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    },
  });

  if (!resp?.success) {
    throw new Error(resp?.error ?? "Ошибка запроса");
  }

  return resp as ExtensionApiResponse<T>;
}
