/**
 * Получение откликов Kwork через Puppeteer (DOM рендерится JS, GET не подходит).
 * Загружает страницу в браузере, дожидается появления контейнера откликов, парсит HTML.
 */

import {
  getWebAuthToken,
  type KworkWebCookie,
  parseOffersFromHtml,
  parseSetCookieToCookieHeader,
  parseSetCookieToCookies,
  type WebParsedOffer,
} from "@qbs-autonaim/integration-clients/server";
import type { AxiosInstance } from "axios";
import axios from "axios";
import puppeteer from "puppeteer";

const KWORK_WEB_BASE = "https://kwork.ru";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
// Контейнер есть даже при 0 откликов; [data-offer-id] — только при наличии
const OFFERS_CONTAINER_SELECTOR =
  ".offers.js-offer-list, .offers, .js-offer-list";
const WAIT_MS = 15000;

function kworkCookiesToPuppeteer(
  cookies: KworkWebCookie[],
  domain = "kwork.ru",
): Array<{
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}> {
  return cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain ?? `.${domain}`,
    path: c.path ?? "/",
    expires: c.expires,
    httpOnly: c.httpOnly,
    secure: c.secure ?? true,
    sameSite: c.sameSite,
  }));
}

export async function getProjectOffersFromBrowser(
  api: AxiosInstance,
  token: string,
  projectId: number,
  options?: { cookieHeader?: string; webCookies?: KworkWebCookie[] },
): Promise<{
  success: boolean;
  offers?: WebParsedOffer[];
  webCookies?: KworkWebCookie[];
  errorMessage?: string;
}> {
  let cookieHeader = options?.cookieHeader;
  let webCookies = options?.webCookies;

  if (!cookieHeader && !webCookies?.length) {
    const authResult = await getWebAuthToken(
      api,
      token,
      `/projects/${projectId}`,
    );
    if (!authResult.success || !authResult.response?.url) {
      return {
        success: false,
        errorMessage: "Не удалось получить web auth token",
      };
    }
    try {
      const loginRes = await axios.get(authResult.response.url, {
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

  const puppeteerCookies =
    webCookies && webCookies.length > 0
      ? kworkCookiesToPuppeteer(webCookies)
      : undefined;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 720 });

    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ Cookie: cookieHeader });
    } else if (puppeteerCookies?.length) {
      await page.goto(KWORK_WEB_BASE, { waitUntil: "domcontentloaded" });
      await page.setCookie(...puppeteerCookies);
    }

    const projectUrl = `${KWORK_WEB_BASE}/projects/${projectId}`;
    await page.goto(projectUrl, { waitUntil: "networkidle0", timeout: 20000 });

    await page.waitForSelector(OFFERS_CONTAINER_SELECTOR, {
      timeout: WAIT_MS,
    });

    const html = await page.content();
    const offers = parseOffersFromHtml(html);

    return { success: true, offers, webCookies };
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : "Ошибка при загрузке страницы в браузере";
    return {
      success: false,
      errorMessage: msg,
      webCookies,
    };
  } finally {
    await browser.close();
  }
}
