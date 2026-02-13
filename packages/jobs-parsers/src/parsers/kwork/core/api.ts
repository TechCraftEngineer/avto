/**
 * Kwork.ru API клиент
 * API: https://api.kwork.ru/
 * Basic auth: mobile_api credentials (Base64)
 */
import axios, { type AxiosInstance } from "axios";

const KWORK_BASE_URL = "https://api.kwork.ru/";
const KWORK_AUTH_HEADER =
  "Basic bW9iaWxlX2FwaTpxRnZmUmw3dw==";

export interface KworkSignInParams {
  login: string;
  password: string;
  /** Данные recaptcha - необходим если ранее пришел код ошибки 118 */
  "g-recaptcha-response"?: string;
  /** Уникальный идентификатор устройства/приложения/браузера */
  uad?: string;
  /** Последние 4 цифры номера телефона */
  phone_last?: string;
  /** Токен для пропуска капчи */
  recaptcha_pass_token?: string;
}

export interface KworkAuthSuccess {
  token?: string;
  [key: string]: unknown;
}

export interface KworkErrorResponse {
  code?: number;
  message?: string;
  recaptcha_pass_token?: string;
  [key: string]: unknown;
}

export const KWORK_ERROR_CODES = {
  CAPTCHA_REQUIRED: 118,
} as const;

function createKworkApiClient(): AxiosInstance {
  return axios.create({
    baseURL: KWORK_BASE_URL,
    headers: {
      Authorization: KWORK_AUTH_HEADER,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

const kworkApi = createKworkApiClient();

/**
 * Аутентификация пользователя с выдачей токена
 * При коде ошибки 118 показать webview со страницей http://kwork.ru/captcha_only
 */
export async function signIn(params: KworkSignInParams): Promise<{
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
  if (params.uad) {
    body.append("uad", params.uad);
  }
  if (params.phone_last) {
    body.append("phone_last", params.phone_last);
  }
  if (params.recaptcha_pass_token) {
    body.append("recaptcha_pass_token", params.recaptcha_pass_token);
  }

  try {
    const response = await kworkApi.post<KworkAuthSuccess | KworkErrorResponse>(
      "signIn",
      body.toString(),
    );

    const data = response.data;

    // Проверяем на ошибку API (часто код ошибки в response)
    if (data && typeof data === "object" && "code" in data && data.code) {
      return {
        success: false,
        error: data as KworkErrorResponse,
      };
    }

    return {
      success: true,
      data: data as KworkAuthSuccess,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as KworkErrorResponse;
      return {
        success: false,
        error: errorData,
      };
    }
    throw error;
  }
}
