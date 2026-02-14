/**
 * Kwork.ru API клиент
 * API: https://api.kwork.ru/
 *
 * Все функции принимают api client первым аргументом.
 * Client создаётся через createKworkApiClient(credentials) с данными из БД интеграций.
 */
import type { AxiosInstance } from "axios";
import * as auth from "./auth";
import * as inbox from "./inbox";
import * as offers from "./offers";
import * as projects from "./projects";

// Типы
export type {
  KworkAuthSuccess,
  KworkDetails,
  KworkErrorResponse,
  KworkInboxMessage,
  KworkInboxTracksParams,
  KworkMyWantsParams,
  KworkOffer,
  KworkOffersParams,
  KworkProject,
  KworkProjectsParams,
  KworkSignInParams,
  KworkWantPayer,
  KworkWebAuthTokenResponse,
  KworkWebCookie,
  WebParsedOffer,
} from "./types";

export { createKworkApiClient, type KworkCredentials } from "./client";
export { KWORK_ERROR_CODES } from "./types";

// Auth
export { extractTokenFromSignInResponse, isKworkAuthError } from "./auth";

export async function signIn(
  api: AxiosInstance,
  params: import("./types").KworkSignInParams,
) {
  return auth.signIn(api, params);
}

export async function getWebAuthToken(
  api: AxiosInstance,
  token: string,
  urlToRedirect?: string,
) {
  return auth.getWebAuthToken(api, token, urlToRedirect);
}

// Projects
export async function getProject(
  api: AxiosInstance,
  token: string,
  projectId: number,
) {
  return projects.getProject(api, token, projectId);
}

export async function getProjects(
  api: AxiosInstance,
  token: string,
  params?: import("./types").KworkProjectsParams,
) {
  return projects.getProjects(api, token, params);
}

export async function getWant(
  api: AxiosInstance,
  token: string,
  projectId: number,
) {
  return projects.getWant(api, token, projectId);
}

export async function getMyWants(
  api: AxiosInstance,
  token: string,
  params?: import("./types").KworkMyWantsParams,
) {
  return projects.getMyWants(api, token, params);
}

export async function getKworkDetails(api: AxiosInstance, kworkId: number) {
  return projects.getKworkDetails(api, kworkId);
}

// Offers
export async function getOffer(
  api: AxiosInstance,
  token: string,
  offerId: number,
) {
  return offers.getOffer(api, token, offerId);
}

export async function getOffers(
  api: AxiosInstance,
  token: string,
  params?: import("./types").KworkOffersParams,
) {
  return offers.getOffers(api, token, params);
}

// Inbox
export async function getDialog(
  api: AxiosInstance,
  token: string,
  userId: number,
) {
  return inbox.getDialog(api, token, userId);
}

export async function sendMessage(
  api: AxiosInstance,
  token: string,
  userId: number,
  text: string,
) {
  return inbox.sendMessage(api, token, userId, text);
}

export async function getInboxTracks(
  api: AxiosInstance,
  token: string,
  params?: import("./types").KworkInboxTracksParams,
) {
  return inbox.getInboxTracks(api, token, params);
}

export async function getInboxMessage(
  api: AxiosInstance,
  token: string,
  messageId: number,
) {
  return inbox.getInboxMessage(api, token, messageId);
}

// Cookies (pure utils, no cheerio)
export { cookiesToHeaderString, parseSetCookieToCookies } from "./cookies";
