/**
 * HTTP клиент для Kwork API
 * https://api.kwork.ru/
 *
 * Credentials берутся из базы интеграций (getIntegrationCredentials).
 */
import axios, { type AxiosInstance } from "axios";

const KWORK_BASE_URL = "https://api.kwork.ru/";
const KWORK_STATIC_AUTH = "Basic bW9iaWxlX2FwaTpxRnZmUmw3dw==";

export interface KworkCredentials {
  login: string;
  password: string;
}

/**
 * Создаёт axios-клиент для Kwork API.
 * Использует статический Basic Auth заголовок для всех запросов.
 * Credentials (login/password) используются для получения токена через API методы.
 */
export function createKworkApiClient(): AxiosInstance {
  return axios.create({
    baseURL: KWORK_BASE_URL,
    headers: {
      Authorization: KWORK_STATIC_AUTH,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}
