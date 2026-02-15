/**
 * Типы и интерфейсы Kwork API
 */

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
  data?: { token?: string };
  response?: string | { token?: string };
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
  user_id?: number;
  worker_id?: number;
  username?: string;
  [key: string]: unknown;
}

export interface KworkOffersParams {
  page?: number;
}

export interface KworkMyWantsParams {
  want_status_id?: string;
  page?: number;
}

/** Сообщение в переписке Kwork */
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

export interface KworkInboxTracksParams {
  userId?: number;
  username?: string;
  page?: number;
  lastConversationId?: number;
  direction?: "before" | "after" | "around";
  limit?: number;
}

/** Диалог из API /dialogs (список диалогов) */
export interface KworkDialog {
  user_id?: number;
  username?: string;
  profilepicture?: string;
  last_message?: string;
  time?: number;
  unread_count?: number;
  [key: string]: unknown;
}

export interface KworkDialogsParams {
  page?: number;
  excludedIds?: string;
}

export interface KworkWebAuthTokenResponse {
  token?: string;
  expires_at?: number;
  url?: string;
  url_to_redirect?: string | null;
}

/** Результат парсинга отклика со страницы проекта Kwork */
export interface WebParsedOffer {
  offerId: number;
  projectId: number;
  workerId: number;
  username: string;
  profileUrl: string;
  avatarUrl: string | null;
  onlineStatus: "online" | "offline" | "unknown";
  offlineTime: string | null;
  price: number;
  currency: string;
  duration: string;
  ordersCount: number;
  reviewsGood: number;
  reviewsBad: number;
  description: string;
}

/** Профиль пользователя Kwork (ответ /user) */
export interface KworkUser {
  id: number;
  username?: string;
  status?: string;
  fullname?: string;
  profilepicture?: string;
  description?: string;
  slogan?: string;
  location?: string;
  rating?: string;
  rating_count?: number;
  level_description?: string;
  good_reviews?: number;
  bad_reviews?: number;
  reviews_count?: number;
  online?: boolean;
  live_date?: number;
  cover?: string;
  custom_request_min_budget?: number;
  is_allow_custom_request?: boolean;
  order_done_persent?: number;
  order_done_intime_persent?: number;
  order_done_repeat_persent?: number;
  timezoneId?: number;
  blocked_by_user?: boolean;
  allowedDialog?: boolean;
  addtime?: number;
  achievments_list?: unknown[];
  completed_orders_count?: number;
  specialization?: string;
  profession?: string;
  kworks_count?: number;
  kworks?: unknown[];
  portfolio_list?: unknown;
  reviews?: unknown;
  skills?: unknown[];
  is_verified_worker?: boolean;
  note?: unknown[];
  is_cashless_payment_available?: boolean;
  [key: string]: unknown;
}

/** Cookie для сохранения в БД */
export interface KworkWebCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}
