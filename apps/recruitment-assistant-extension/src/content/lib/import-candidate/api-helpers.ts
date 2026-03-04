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
  const rawToken = options.token?.toString?.();
  if (!rawToken || rawToken.trim() === "") {
    throw new Error("Missing or empty token");
  }

  const { getExtensionApiUrl } = await import("../../../config");
  const { method = "POST", body } = options;

  let resp: unknown;
  try {
    resp = await chrome.runtime.sendMessage({
      type: "API_REQUEST",
      payload: {
        url: getExtensionApiUrl(endpoint),
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rawToken}`,
        },
        body,
      },
    });
  } catch (err) {
    throw new Error(
      `Ошибка запроса: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const r = resp as { success?: boolean; error?: string; data?: T };
  if (!r?.success) {
    throw new Error(r?.error ?? "Ошибка запроса");
  }

  return r as ExtensionApiResponse<T>;
}
