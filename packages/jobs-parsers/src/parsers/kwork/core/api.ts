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

/**
 * Проверяет, указывает ли ошибка Kwork API на проблему с токеном (истёкший/невалидный).
 * В таких случаях можно попробовать переавторизоваться через signIn.
 */
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

/** Проект для покупателя (want_payer) */
export interface KworkWantPayer {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  want_status_id?: number;
  date_create?: number | null;
  date_active?: number | null;
  date_expire?: number | null;
  price_limit?: number;
  views?: number;
  orders?: number;
  offers?: number;
  allow_higher_price?: boolean;
  possible_price_limit?: number;
  [key: string]: unknown;
}

/** Предложение на запрос услуги (offer) */
export interface KworkOffer {
  id: number;
  status?: string;
  title?: string;
  comment?: string;
  price?: number;
  duration?: number;
  date_create?: number;
  is_actual?: boolean;
  is_read?: boolean;
  read_status?: number;
  want_id?: number;
  order_id?: number;
  kwork_id?: number;
  project?: KworkProject & { user_id?: number; username?: string };
  /** ID фрилансера (продавца), отправившего отклик — может приходить в ответе API */
  user_id?: number;
  worker_id?: number;
  username?: string;
  [key: string]: unknown;
}

/** Параметры для getOffers */
export interface KworkOffersParams {
  page?: number;
}

/**
 * Получить проект для покупателя (want) — данные по запросу на услугу
 */
export async function getWant(
  token: string,
  projectId: number,
): Promise<{
  success: boolean;
  response?: KworkWantPayer[];
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(projectId), token });
    const response = await kworkApi.post<
      | { success?: boolean; response?: KworkWantPayer[]; code?: number }
      | KworkErrorResponse
    >("want", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && (data as KworkErrorResponse).code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkWantPayer[] })?.response ?? [],
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
 * Получить список предложений пользователя (offers)
 * Для покупателя — отклики на его проекты; фильтрация по want_id — на стороне клиента
 */
export async function getOffers(
  token: string,
  params: KworkOffersParams = {},
): Promise<{
  success: boolean;
  response?: KworkOffer[];
  paging?: { page: number; total: number; limit?: number; pages?: number };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    if (params.page != null) body.append("page", String(params.page));

    const response = await kworkApi.post<{
      success?: boolean;
      response?: KworkOffer[];
      paging?: { page: number; total: number; limit?: number; pages?: number };
      code?: number;
    }>("offers", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && (data as KworkErrorResponse).code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    const result = data as {
      response?: KworkOffer[];
      paging?: { page: number; total: number; limit?: number; pages?: number };
    };
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
 * Получить одно предложение по ID
 */
export async function getOffer(
  token: string,
  offerId: number,
): Promise<{
  success: boolean;
  response?: KworkOffer;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(offerId), token });
    const response = await kworkApi.post<
      | { success?: boolean; response?: KworkOffer; code?: number }
      | KworkErrorResponse
    >("offer", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && (data as KworkErrorResponse).code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkOffer })?.response,
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

/** Сообщение в переписке Kwork (inbox_message / inbox_track_message) */
export interface KworkInboxMessage {
  message_id?: number;
  conversation_id?: number;
  to_id?: number;
  from_id?: number;
  from_username?: string;
  message?: string;
  time?: number;
  unread?: boolean;
  type?: string;
  [key: string]: unknown;
}

/** Параметры для getInboxTracks */
export interface KworkInboxTracksParams {
  userId?: number;
  username?: string;
  page?: number;
  lastConversationId?: number;
  direction?: "before" | "after" | "around";
  limit?: number;
}

/**
 * Получить диалог по идентификатору собеседника
 */
export async function getDialog(
  token: string,
  userId: number,
): Promise<{
  success: boolean;
  response?: unknown;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(userId), token });
    const response = await kworkApi.post<
      | { success?: boolean; response?: unknown; code?: number }
      | KworkErrorResponse
    >("getDialog", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && (data as KworkErrorResponse).code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: unknown })?.response,
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
 * Отправить сообщение в диалог
 */
export async function sendMessage(
  token: string,
  userId: number,
  text: string,
): Promise<{
  success: boolean;
  response?: { id?: number; conversation_id?: number; type?: string };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    body.append("user_id", String(userId));
    body.append("text", text);

    const response = await kworkApi.post<
      | {
          success?: boolean;
          response?: { id?: number; conversation_id?: number; type?: string };
          code?: number;
        }
      | KworkErrorResponse
    >("inboxCreate", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && (data as KworkErrorResponse).code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: { id?: number; conversation_id?: number; type?: string } })
        ?.response,
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
 * Получить сообщения в диалоге (с треками)
 */
export async function getInboxTracks(
  token: string,
  params: KworkInboxTracksParams = {},
): Promise<{
  success: boolean;
  response?: KworkInboxMessage[];
  paging?: { page?: number; total?: number };
  user?: { user_id?: number; username?: string };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    if (params.userId != null) body.append("userId", String(params.userId));
    if (params.username) body.append("username", params.username);
    if (params.page != null) body.append("page", String(params.page));
    if (params.lastConversationId != null)
      body.append("lastConversationId", String(params.lastConversationId));
    if (params.direction) body.append("direction", params.direction);
    if (params.limit != null) body.append("limit", String(params.limit));

    const response = await kworkApi.post<
      | {
          success?: boolean;
          response?: KworkInboxMessage[];
          paging?: { page?: number; total?: number };
          user?: { user_id?: number; username?: string };
          code?: number;
        }
      | KworkErrorResponse
    >("getInboxTracks", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && (data as KworkErrorResponse).code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    const result = data as {
      response?: KworkInboxMessage[];
      paging?: { page?: number; total?: number };
      user?: { user_id?: number; username?: string };
    };
    return {
      success: true,
      response: result?.response ?? [],
      paging: result?.paging,
      user: result?.user,
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
 * Получить одно сообщение по messageId
 */
export async function getInboxMessage(
  token: string,
  messageId: number,
): Promise<{
  success: boolean;
  response?: KworkInboxMessage[];
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ messageId: String(messageId), token });
    const response = await kworkApi.post<
      | { success?: boolean; response?: KworkInboxMessage[]; code?: number }
      | KworkErrorResponse
    >("inboxMessage", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && (data as KworkErrorResponse).code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkInboxMessage[] })?.response ?? [],
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
