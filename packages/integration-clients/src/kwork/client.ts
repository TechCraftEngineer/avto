/**
 * HTTP клиент для Kwork API
 * https://api.kwork.ru/
 */
import axios, { type AxiosInstance } from "axios";

const KWORK_BASE_URL = "https://api.kwork.ru/";

function getKworkAuthHeader(): string {
  const header = process.env.KWORK_AUTH_HEADER;
  if (header) return header.startsWith("Basic ") ? header : `Basic ${header}`;

  const user = process.env.KWORK_USER;
  const pass = process.env.KWORK_PASS;
  if (user && pass) {
    return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  }

  throw new Error(
    "Kwork API credentials missing: set KWORK_AUTH_HEADER (Base64) or KWORK_USER + KWORK_PASS",
  );
}

export function createKworkApiClient(): AxiosInstance {
  const authHeader = getKworkAuthHeader();
  return axios.create({
    baseURL: KWORK_BASE_URL,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

export const kworkApi = createKworkApiClient();
