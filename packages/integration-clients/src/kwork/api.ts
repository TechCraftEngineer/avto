/**
 * Kwork.ru API клиент
 * API: https://api.kwork.ru/
 * Barrel: реэкспорт модулей с привязкой к общему axios-клиенту.
 * Без web-offers (cheerio) — для app build. Server-only: см. server.ts
 */
import { kworkApi } from "./client";
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

export { KWORK_ERROR_CODES } from "./types";

// Auth (без api в сигнатуре для обратной совместимости)
export { extractTokenFromSignInResponse, isKworkAuthError } from "./auth";

export async function signIn(
  params: import("./types").KworkSignInParams,
) {
  return auth.signIn(kworkApi, params);
}

export async function getWebAuthToken(token: string, urlToRedirect?: string) {
  return auth.getWebAuthToken(kworkApi, token, urlToRedirect);
}

// Projects
export async function getProject(token: string, projectId: number) {
  return projects.getProject(kworkApi, token, projectId);
}

export async function getProjects(
  token: string,
  params?: import("./types").KworkProjectsParams,
) {
  return projects.getProjects(kworkApi, token, params);
}

export async function getWant(token: string, projectId: number) {
  return projects.getWant(kworkApi, token, projectId);
}

export async function getMyWants(
  token: string,
  params?: import("./types").KworkMyWantsParams,
) {
  return projects.getMyWants(kworkApi, token, params);
}

export async function getKworkDetails(kworkId: number) {
  return projects.getKworkDetails(kworkApi, kworkId);
}

// Offers
export async function getOffer(token: string, offerId: number) {
  return offers.getOffer(kworkApi, token, offerId);
}

export async function getOffers(
  token: string,
  params?: import("./types").KworkOffersParams,
) {
  return offers.getOffers(kworkApi, token, params);
}

// Inbox
export async function getDialog(token: string, userId: number) {
  return inbox.getDialog(kworkApi, token, userId);
}

export async function sendMessage(token: string, userId: number, text: string) {
  return inbox.sendMessage(kworkApi, token, userId, text);
}

export async function getInboxTracks(
  token: string,
  params?: import("./types").KworkInboxTracksParams,
) {
  return inbox.getInboxTracks(kworkApi, token, params);
}

export async function getInboxMessage(token: string, messageId: number) {
  return inbox.getInboxMessage(kworkApi, token, messageId);
}

// Cookies (pure utils, no cheerio)
export { cookiesToHeaderString, parseSetCookieToCookies } from "./cookies";
