/**
 * Вспомогательные функции для API запросов расширения
 */

import { z } from "zod";

/** Схема ответа chrome.runtime.sendMessage для API_REQUEST */
export const apiRequestResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type ApiRequestResponse = z.infer<typeof apiRequestResponseSchema>;

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
    throw new Error("Отсутствует или пустой токен");
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

  const parsed = apiRequestResponseSchema.safeParse(resp);
  if (!parsed.success) {
    throw new Error(`Неверный ответ API: ${parsed.error.message}`);
  }
  const r = parsed.data;
  if (!r.success) {
    throw new Error(r.error ?? "Ошибка запроса");
  }

  return {
    success: true,
    data: r.data as T,
    error: r.error,
  } as ExtensionApiResponse<T>;
}
