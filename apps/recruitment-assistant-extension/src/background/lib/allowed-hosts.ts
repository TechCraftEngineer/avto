/**
 * Разрешённые хосты для API и изображений (защита от SSRF)
 * __ALLOW_LOOPBACK__ задаётся в vite.config при сборке с localhost.
 */

declare const __ALLOW_LOOPBACK__: boolean | undefined;

const isTest =
  typeof process !== "undefined" && process.env?.NODE_ENV === "test";
const allowLoopback =
  isTest || (typeof __ALLOW_LOOPBACK__ !== "undefined" && __ALLOW_LOOPBACK__);

export const ALLOWED_API_HOSTS = [
  "app.avtonaim.qbsoft.ru",
  "ext-api.avtonaim.qbsoft.ru",
  ...(isTest ? ["api.example.com"] : []),
  ...(allowLoopback ? ["localhost", "127.0.0.1"] : []),
] as const;

export const ALLOWED_IMAGE_HOSTS = [
  "media.licdn.com",
  "dms.licdn.com",
  "hh.ru",
  "www.hh.ru",
  ...(isTest ? ["cdn.example.com"] : []),
] as const;

export const ALLOWED_RESUME_HOSTS = [
  "hh.ru",
  "www.hh.ru",
  ...(isTest ? ["resume.example.com"] : []),
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

export function isResumeHostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_RESUME_HOSTS.some(
    (allowed) => h === allowed || h.endsWith(`.${allowed}`),
  );
}
