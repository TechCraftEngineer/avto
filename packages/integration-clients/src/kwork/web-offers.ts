/**
 * Парсинг откликов со веб-страницы проекта Kwork (API offers не работает)
 */
import axios from "axios";
import type { Cheerio } from "cheerio";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { AxiosInstance } from "axios";
import { getWebAuthToken } from "./auth";
import type {
  KworkErrorResponse,
  KworkWebCookie,
  WebParsedOffer,
} from "./types";

const KWORK_WEB_BASE = "https://kwork.ru";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

function parseSetCookieToCookieHeader(setCookie: string[] | string): string {
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie];
  return headers
    .map((h) => {
      const first = h.split(";")[0]?.trim();
      return first ?? "";
    })
    .filter(Boolean)
    .join("; ");
}

/** Парсит Set-Cookie заголовки в массив cookies для сохранения в БД */
export function parseSetCookieToCookies(
  setCookie: string[] | string,
): KworkWebCookie[] {
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie];
  const cookies: KworkWebCookie[] = [];

  for (const h of headers) {
    const parts = h.split(";").map((p) => p.trim());
    const [nameVal] = parts;
    if (!nameVal?.includes("=")) continue;

    const eqIdx = nameVal.indexOf("=");
    const name = nameVal.slice(0, eqIdx).trim();
    const value = nameVal.slice(eqIdx + 1).trim();
    if (!name) continue;

    const cookie: KworkWebCookie = { name, value };

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      const lower = part.toLowerCase();
      if (lower === "httponly") cookie.httpOnly = true;
      else if (lower === "secure") cookie.secure = true;
      else if (part.startsWith("Path="))
        cookie.path = part.slice(5).trim();
      else if (part.startsWith("Domain="))
        cookie.domain = part.slice(7).trim();
      else if (part.startsWith("Expires=")) {
        const dateStr = part.slice(8).trim();
        const ts = new Date(dateStr).getTime();
        if (!Number.isNaN(ts)) cookie.expires = Math.floor(ts / 1000);
      } else if (part.startsWith("Max-Age=")) {
        const sec = Number.parseInt(part.slice(8).trim(), 10);
        if (!Number.isNaN(sec))
          cookie.expires = Math.floor(Date.now() / 1000) + sec;
      } else if (part.startsWith("SameSite=")) {
        const v = part.slice(9).trim();
        if (v === "Strict" || v === "Lax" || v === "None")
          cookie.sameSite = v;
      }
    }
    cookies.push(cookie);
  }
  return cookies;
}

/** Преобразует cookies в строку для заголовка Cookie */
export function cookiesToHeaderString(
  cookies: Array<{ name: string; value: string }>,
): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

function parseOfferFromCheerio(el: Cheerio<Element>): WebParsedOffer {
  const text = (e: Cheerio<Element>) =>
    (e?.length ? e.text().replace(/\s+/g, " ").trim() : "") || "";

  const attr = (e: Cheerio<Element>, name: string) =>
    (e?.length ? e.attr(name) : undefined) ?? "";

  const num = (value: string) => Number(value.replace(/[^\d]/g, ""));

  const offerId = Number(el.attr("data-offer-id") ?? 0);
  const projectId = Number(el.attr("data-project-id") ?? 0);
  const workerId = Number(el.attr("data-worker-id") ?? 0);

  const profileLink = el.find(".offer-item__title").first();
  const avatarImg = el.find(".user-avatar__picture").first();

  const statusEl = el.find(".online-status").first();
  const isOffline = statusEl.length
    ? statusEl.hasClass("online-status--offline")
    : undefined;

  const priceEl = el.find(".offer-item__price span").first();
  const durationEl = el.find(".offer-item__price .dib").first();

  const ordersEl = el.find(".offer-item__seller-count-orders b").first();

  const reviews = el.find(".seller-reviews__count-item span");

  const descriptionEl = el
    .find(".offer-item__text.offer-item__text--max-height")
    .first();

  return {
    offerId,
    projectId,
    workerId,
    username: text(profileLink),
    profileUrl: attr(profileLink, "href"),
    avatarUrl: avatarImg.length ? (avatarImg.attr("src") ?? null) : null,
    onlineStatus:
      isOffline === undefined ? "unknown" : isOffline ? "offline" : "online",
    offlineTime: text(statusEl.find(".online-status__time")) || null,
    price: priceEl.length ? num(text(priceEl)) : 0,
    currency: priceEl.find(".rouble").length ? "RUB" : "",
    duration: text(durationEl),
    ordersCount: ordersEl.length ? Number(text(ordersEl)) : 0,
    reviewsGood: reviews.length > 0 ? Number(text(reviews.eq(0))) : 0,
    reviewsBad: reviews.length > 1 ? Number(text(reviews.eq(1))) : 0,
    description: text(descriptionEl),
  };
}

export async function getProjectOffersFromWeb(
  api: AxiosInstance,
  token: string,
  projectId: number,
  options?: { cookieHeader?: string },
): Promise<{
  success: boolean;
  offers?: WebParsedOffer[];
  webCookies?: KworkWebCookie[];
  error?: KworkErrorResponse;
  errorMessage?: string;
}> {
  let cookieHeader = options?.cookieHeader;
  let webCookies: KworkWebCookie[] | undefined;

  if (!cookieHeader) {
    const authResult = await getWebAuthToken(
      api,
      token,
      `/projects/${projectId}`,
    );

    if (!authResult.success || !authResult.response?.url) {
      return {
        success: false,
        error: authResult.error,
        errorMessage: "Не удалось получить web auth token",
      };
    }

    const loginUrl = authResult.response.url;

    try {
      const loginRes = await axios.get(loginUrl, {
        maxRedirects: 0,
        validateStatus: (s) => s === 302 || s === 200,
        headers: { "User-Agent": USER_AGENT },
      });

      const setCookie = loginRes.headers["set-cookie"];
      if (!setCookie) {
        return {
          success: false,
          errorMessage: "Не получены cookies при входе в веб-версию",
        };
      }

      webCookies = parseSetCookieToCookies(setCookie);
      cookieHeader = parseSetCookieToCookieHeader(setCookie);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Ошибка при входе в веб-версию";
      return { success: false, errorMessage: msg };
    }
  }

  const projectUrl = `${KWORK_WEB_BASE}/projects/${projectId}`;

  try {
    const projectRes = await axios.get(projectUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: cookieHeader,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
      },
      responseType: "text",
    });

    const html = projectRes.data;
    if (typeof html !== "string") {
      return {
        success: false,
        errorMessage: "Неверный формат ответа страницы",
      };
    }

    const $ = cheerio.load(html);
    const offersContainer = $(".offers.js-offer-list");
    if (!offersContainer.length) {
      return {
        success: false,
        offers: [],
        webCookies,
        errorMessage:
          "Контейнер откликов не найден (возможно, требуется авторизация)",
      };
    }

    const offerEls = offersContainer.find("[data-offer-id]");
    const offers: WebParsedOffer[] = [];

    offerEls.each((_, node) => {
      const el = $(node);
      const offerId = Number(el.attr("data-offer-id"));
      if (offerId) {
        offers.push(parseOfferFromCheerio(el));
      }
    });

    return { success: true, offers, webCookies };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Ошибка при загрузке страницы";
    return {
      success: false,
      errorMessage: msg,
      webCookies,
    };
  }
}
