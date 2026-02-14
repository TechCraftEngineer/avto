/**
 * HTTP клиент для Kwork API
 * https://api.kwork.ru/
 */
import axios, { type AxiosInstance } from "axios";

const KWORK_BASE_URL = "https://api.kwork.ru/";
const KWORK_AUTH_HEADER = "Basic bW9iaWxlX2FwaTpxRnZmUmw3dw==";

export function createKworkApiClient(): AxiosInstance {
  return axios.create({
    baseURL: KWORK_BASE_URL,
    headers: {
      Authorization: KWORK_AUTH_HEADER,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

export const kworkApi = createKworkApiClient();
