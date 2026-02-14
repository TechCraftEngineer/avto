/**
 * Аутентификация Kwork API
 */
import axios, { type AxiosInstance } from "axios";
import type {
  KworkAuthSuccess,
  KworkErrorResponse,
  KworkSignInParams,
  KworkWebAuthTokenResponse,
} from "./types";

const TOKEN_KEYS = ["token", "auth_token", "access_token"] as const;

/** Извлекает токен из ответа signIn */
export function extractTokenFromSignInResponse(
  data: KworkAuthSuccess | Record<string, unknown> | undefined,
): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;

  const tryGetToken = (obj: Record<string, unknown>): string | undefined => {
    for (const key of TOKEN_KEYS) {
      const v = obj[key];
      if (typeof v === "string") return v;
    }
    return undefined;
  };

  const t = tryGetToken(d);
  if (t) return t;

  const inner = d.data;
  if (inner && typeof inner === "object") {
    const t2 = tryGetToken(inner as Record<string, unknown>);
    if (t2) return t2;
  }

  const resp = d.response;
  if (typeof resp === "string") return resp;
  if (resp && typeof resp === "object") {
    const t3 = tryGetToken(resp as Record<string, unknown>);
    if (t3) return t3;
  }
  return undefined;
}

/** Проверяет, указывает ли ошибка на проблему с токеном */
export function isKworkAuthError(error?: KworkErrorResponse | null): boolean {
  if (!error) return false;
  const msg = String(error.message ?? error.error ?? "").toLowerCase();
  return (
    msg.includes("token") ||
    msg.includes("токен") ||
    msg.includes("авториз") ||
    msg.includes("authorization") ||
    msg.includes("требуется token") ||
    msg.includes("неверный token")
  );
}

export async function signIn(
  api: AxiosInstance,
  params: KworkSignInParams,
): Promise<{
  success: boolean;
  data?: KworkAuthSuccess;
  error?: KworkErrorResponse;
}> {
  const body = new URLSearchParams();
  body.append("login", params.login);
  body.append("password", params.password);
  if (params["g-recaptcha-response"]) {
    body.append("g-recaptcha-response", params["g-recaptcha-response"]);
  }
  if (params.uad) body.append("uad", params.uad);
  if (params.phone_last) body.append("phone_last", params.phone_last);
  if (params.recaptcha_pass_token) {
    body.append("recaptcha_pass_token", params.recaptcha_pass_token);
  }

  try {
    const response = await api.post<KworkAuthSuccess | KworkErrorResponse>(
      "signIn",
      body.toString(),
    );

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && data.code) {
      return { success: false, error: data as KworkErrorResponse };
    }

    return { success: true, data: data as KworkAuthSuccess };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        error: error.response.data as KworkErrorResponse,
      };
    }
    throw error;
  }
}

export async function getWebAuthToken(
  api: AxiosInstance,
  token: string,
  urlToRedirect?: string,
): Promise<{
  success: boolean;
  response?: KworkWebAuthTokenResponse;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);

    const url =
      urlToRedirect != null
        ? `getWebAuthToken?url_to_redirect=${encodeURIComponent(urlToRedirect)}`
        : "getWebAuthToken";

    const response = await api.post<
      | { success?: boolean; response?: KworkWebAuthTokenResponse; code?: number }
      | KworkErrorResponse
    >(url, body.toString());

    const data = response.data;
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      (data as KworkErrorResponse).code
    ) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkWebAuthTokenResponse })?.response,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        error: error.response.data as KworkErrorResponse,
      };
    }
    throw error;
  }
}
