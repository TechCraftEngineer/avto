/**
 * Проксирование API запросов для обхода CORS
 */

import type { ApiRequest, ApiResponse } from "../shared/types";
import { log, logError } from "./lib";
import { isApiHostAllowed } from "./lib/allowed-hosts";

export const FETCH_TIMEOUT_MS = 10000;

export function isApiRequest(payload: unknown): payload is ApiRequest {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (typeof p.url !== "string" || !p.url) return false;
  const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  if (!validMethods.includes(p.method as string)) return false;
  return true;
}

export async function proxyApiRequest(
  request: ApiRequest,
): Promise<ApiResponse> {
  try {
    log("Проксирование API запроса", {
      url: request.url,
      method: request.method,
    });

    if (!request.url || typeof request.url !== "string") {
      throw new Error("Некорректный URL запроса");
    }

    const url = new URL(request.url);
    const isLocalhost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!request.url.startsWith("https://") && !isLocalhost) {
      throw new Error("Разрешены только HTTPS запросы");
    }
    if (!isApiHostAllowed(url)) {
      throw new Error("Домен не в списке разрешённых");
    }

    const headers: HeadersInit = { ...request.headers };
    if (request.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
      fetchOptions.body = JSON.stringify(request.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    fetchOptions.signal = controller.signal;

    const response = await fetch(request.url, fetchOptions);
    clearTimeout(timeoutId);

    let data: unknown;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      log("API запрос завершился с ошибкой", {
        status: response.status,
        statusText: response.statusText,
      });

      const errorMessage =
        typeof data === "object" && data !== null
          ? "error" in data &&
            typeof (data as { error?: string }).error === "string"
            ? (data as { error: string }).error
            : "message" in data &&
                typeof (data as { message?: string }).message === "string"
              ? (data as { message: string }).message
              : response.statusText || "Ошибка запроса к API"
          : response.statusText || "Ошибка запроса к API";

      return {
        success: false,
        error: errorMessage,
        status: response.status,
        data,
      };
    }

    log("API запрос выполнен успешно", { status: response.status });

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    logError("Ошибка при выполнении API запроса", error);

    let errorMessage = "Не удалось выполнить запрос к API";

    if (error instanceof Error && error.name === "AbortError") {
      errorMessage =
        "Превышено время ожидания ответа от сервера. Попробуйте позже.";
    } else if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage =
        "Не удалось подключиться к серверу. Проверьте подключение к интернету.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
