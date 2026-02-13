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

/** Параметры для запроса списка проектов */
export interface KworkProjectsParams {
  categories?: string;
  price_from?: number;
  price_to?: number;
  page?: number;
  query?: string;
}

/** Проект Kwork (запрос покупателя) - want_worker */
export interface KworkProject {
  id: number;
  status?: string;
  user_id?: number;
  username?: string;
  profile_picture?: string;
  price?: number;
  title?: string;
  description?: string;
  offers?: number;
  time_left?: number;
  parent_category_id?: number;
  category_id?: number;
  [key: string]: unknown;
}

/** Детали кворка (услуги продавца) */
export interface KworkDetails {
  id: string;
  kwork_link?: string;
  kwork_title?: string;
  kwork_description?: string;
  default_kwork_price?: number;
  term?: string;
  orders_in_queue_count?: number;
  category?: number;
  [key: string]: unknown;
}

/**
 * Получить проект по ID (требует token)
 */
export async function getProject(
  token: string,
  projectId: number,
): Promise<{ success: boolean; response?: KworkProject; error?: KworkErrorResponse }> {
  try {
    const body = new URLSearchParams({ id: String(projectId), token });
    const response = await kworkApi.post<{ success?: boolean; response?: KworkProject; code?: number }>(
      "project",
      body.toString(),
    );

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && data.code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkProject })?.response,
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

/**
 * Получить список проектов (требует token)
 */
export async function getProjects(
  token: string,
  params: KworkProjectsParams = {},
): Promise<{
  success: boolean;
  response?: KworkProject[];
  paging?: { page: number; total: number; limit: number };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    if (params.categories) body.append("categories", params.categories);
    if (params.price_from != null) body.append("price_from", String(params.price_from));
    if (params.price_to != null) body.append("price_to", String(params.price_to));
    if (params.page != null) body.append("page", String(params.page));
    if (params.query) body.append("query", params.query);

    const response = await kworkApi.post<{
      success?: boolean;
      response?: KworkProject[];
      paging?: { page: number; total: number; limit: number };
      code?: number;
    }>("projects", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && data.code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    const result = data as { response?: KworkProject[]; paging?: { page: number; total: number; limit: number } };
    return {
      success: true,
      response: result?.response ?? [],
      paging: result?.paging,
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

/**
 * Получить детали кворка по ID (без token)
 */
export async function getKworkDetails(kworkId: number): Promise<{
  success: boolean;
  response?: KworkDetails;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(kworkId) });
    const response = await kworkApi.post<{ success?: boolean; response?: KworkDetails; code?: number }>(
      "getKworkDetails",
      body.toString(),
    );

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && data.code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkDetails })?.response,
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
