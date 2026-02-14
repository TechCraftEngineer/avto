/**
 * Утилиты для работы с cookies Kwork (pure, без cheerio).
 * Вынесены из web-offers для использования в main entry без server deps.
 */
import type { KworkWebCookie } from "./types";

export function parseSetCookieToCookieHeader(setCookie: string[] | string): string {
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
