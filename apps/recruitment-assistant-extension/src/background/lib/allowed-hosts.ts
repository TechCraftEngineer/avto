/**
 * Разрешённые хосты для API и изображений (защита от SSRF)
 */

const isTest =
  typeof process !== "undefined" && process.env?.NODE_ENV === "test";

export const ALLOWED_API_HOSTS = [
  "app.avtonaim.qbsoft.ru",
  "ext-api.avtonaim.qbsoft.ru",
  "localhost",
  "127.0.0.1",
  ...(isTest ? ["api.example.com"] : []),
] as const;

export const ALLOWED_IMAGE_HOSTS = [
  "media.licdn.com",
  "hh.ru",
  "www.hh.ru",
  ...(isTest ? ["cdn.example.com"] : []),
] as const;

export function isApiHostAllowed(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return ALLOWED_API_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export function isImageHostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_IMAGE_HOSTS.some(
    (allowed) => h === allowed || h.endsWith(`.${allowed}`),
  );
}
