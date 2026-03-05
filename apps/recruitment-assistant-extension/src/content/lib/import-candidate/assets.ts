/**
 * Загрузка фото и резюме для разных платформ (LinkedIn, HH)
 */

import type { ValidPlatformSource } from "./platform";

/** Возвращает хост URL или undefined для безопасного логирования (без PII) */
function safeHost(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

export interface FetchedAssets {
  photoUrl?: string;
  resumePdfBase64?: string;
  resumeTextHtml?: string;
}

/** Проверяет, что URL фото не placeholder/пустой */
function isValidPhotoUrl(src: string | undefined): boolean {
  if (!src) return false;
  return (
    !src.includes("placeholder") &&
    !src.includes("blank") &&
    !src.includes("no-photo")
  );
}

/** Только CDN профильных фото LinkedIn. Исключает px.ads, tracking, и т.п. */
function isLinkedInProfilePhotoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();
    const path = urlObj.pathname.toLowerCase();
    if (
      host.includes("ads.") ||
      host.startsWith("px.") ||
      path.includes("/collect")
    )
      return false;
    const isCdn =
      host === "media.licdn.com" ||
      host === "dms.licdn.com" ||
      host.endsWith(".media.licdn.com") ||
      host.endsWith(".dms.licdn.com");
    const looksLikePhoto =
      path.includes("profile") ||
      path.includes("displayphoto") ||
      path.includes("dms/image");
    return isCdn && looksLikePhoto;
  } catch {
    return false;
  }
}

/** Проверяет, что строка уже в формате data:image/...;base64,... */
function isDataUrlBase64(s: string): boolean {
  return /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(s);
}

/** Селекторы фото профиля LinkedIn. profile-top-card-member-photo — фото в шапке профиля. */
const LINKEDIN_PHOTO_SELECTORS = [
  'a[data-view-name="profile-top-card-member-photo"] img', // фото в шапке профиля
  'figure[data-view-name="image"] img',
  'img[src*="media.licdn.com"][src*="profile-displayphoto"]',
  'img[data-delayed-url*="media.licdn"]',
  'img[data-delayed-url*="profile-displayphoto"]',
  ".pv-top-card-profile-picture img",
  "img.pv-top-card-profile-picture__image",
  ".pv-top-card-photo img",
  ".pv-top-card img[src*='media.licdn.com']",
  ".pv-top-card img[src*='profile-displayphoto']",
  'section[data-section="profile-photo"] img',
  '[data-view-name="profile-photo"] img',
  "img[src*='media.licdn.com']",
  "img[src*='profile-displayphoto']",
];

const DEBUG_LINKEDIN_PHOTO = false; // Включить для отладки: DevTools → Console, фильтр [LinkedIn Photo]

/** Загружает фото для LinkedIn профиля.
 * Использует несколько селекторов (как parse-profile-dom) для устойчивости к изменениям DOM.
 * Возвращает base64 data URL для импорта.
 */
async function fetchLinkedInPhoto(
  document: Document,
  fallbackPhotoUrl?: string,
): Promise<string | undefined> {
  const log = DEBUG_LINKEDIN_PHOTO
    ? console.warn.bind(console, "[LinkedIn Photo]")
    : () => {};

  let photoSrc: string | undefined;
  let matchedSelector: string | null = null;

  for (const sel of LINKEDIN_PHOTO_SELECTORS) {
    const nodes = document.querySelectorAll<HTMLImageElement>(sel);
    for (const el of nodes) {
      const u =
        el.getAttribute("data-delayed-url") || el.getAttribute("src") || el.src;
      if (u && isLinkedInProfilePhotoUrl(u)) {
        photoSrc = u;
        matchedSelector = sel;
        break;
      }
    }
    if (photoSrc) break;
  }

  log("DOM:", {
    found: !!photoSrc,
    selector: matchedSelector ?? "none",
    host: photoSrc ? safeHost(photoSrc) : null,
    fallbackHost: fallbackPhotoUrl ? safeHost(fallbackPhotoUrl) : undefined,
  });

  if (
    !photoSrc &&
    fallbackPhotoUrl &&
    isLinkedInProfilePhotoUrl(fallbackPhotoUrl)
  ) {
    photoSrc = fallbackPhotoUrl;
    log("Используем fallbackPhotoUrl из данных профиля");
  }

  if (!photoSrc) {
    log("Пропуск: ни DOM, ни fallback не дали валидный URL профильного фото");
    return undefined;
  }

  if (isDataUrlBase64(photoSrc)) {
    log("Уже base64 — возвращаем как есть");
    return photoSrc;
  }

  const urlToFetch = photoSrc;
  log("Загрузка:", `${urlToFetch.slice(0, 80)}...`);

  try {
    const { fetchImageAsBase64ViaExtension } = await import(
      "../../../parsers/hh-employer/fetch-resume-html"
    );
    const { base64, contentType } =
      await fetchImageAsBase64ViaExtension(urlToFetch);
    log("Успех:", { contentType, sizeBase64: base64.length });
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    log(
      "Ошибка загрузки фото:",
      err instanceof Error ? err.message : String(err),
    );
    if (DEBUG_LINKEDIN_PHOTO) {
      console.error("[LinkedIn Photo] fetch failed", {
        host: safeHost(urlToFetch),
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return undefined;
  }
}

/** Загружает фото и резюме для HH профиля */
async function fetchHHAssets(
  document: Document,
  profileUrl: string,
  candidateName: string,
  fallbackPhotoUrl?: string,
): Promise<FetchedAssets> {
  const { fetchPhotoAsBase64, fetchResumePdfAsBase64 } = await import(
    "../../../parsers/hh-employer/fetch-resume-html"
  );
  const { getResumePdfUrl, fetchResumeTextHtml } = await import(
    "../../../parsers/hh-employer/fetch-resume-text"
  );

  const result: FetchedAssets = {};

  const photoImg = document.querySelector<HTMLImageElement>(
    'div[data-qa="resume-photo"] img',
  );
  const photoSrc = photoImg?.src || fallbackPhotoUrl;
  if (photoSrc && isValidPhotoUrl(photoSrc)) {
    try {
      const { base64, contentType } = await fetchPhotoAsBase64(photoSrc);
      result.photoUrl = `data:${contentType};base64,${base64}`;
    } catch (err) {
      console.error("[fetchHHAssets] fetchPhotoAsBase64 failed", {
        host: safeHost(photoSrc ?? undefined),
        hasPhoto: !!photoSrc,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    result.resumeTextHtml = await fetchResumeTextHtml(
      profileUrl,
      candidateName,
      { baseOrigin: window.location.origin },
    );
  } catch (err) {
    console.error("[fetchHHAssets] fetchResumeTextHtml failed", {
      host: safeHost(profileUrl),
      message: err instanceof Error ? err.message : String(err),
    });
  }

  const pdfUrl = getResumePdfUrl(profileUrl, candidateName);
  if (pdfUrl) {
    try {
      const { base64 } = await fetchResumePdfAsBase64(pdfUrl);
      result.resumePdfBase64 = base64;
    } catch (err) {
      console.error("[fetchHHAssets] fetchResumePdfAsBase64 failed", {
        host: safeHost(pdfUrl),
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

/** Загружает ассеты в зависимости от платформы */
export async function fetchPlatformAssets(
  source: ValidPlatformSource,
  context: {
    profileUrl?: string;
    candidateName: string;
    document?: Document;
    fallbackPhotoUrl?: string;
  },
): Promise<FetchedAssets> {
  const { document } = context;
  if (!document || typeof document === "undefined") return {};

  if (source === "LINKEDIN") {
    if (DEBUG_LINKEDIN_PHOTO) {
      console.warn("[LinkedIn Photo] fetchPlatformAssets вызван", {
        hasFallback: !!context.fallbackPhotoUrl,
        fallbackHost: context.fallbackPhotoUrl
          ? safeHost(context.fallbackPhotoUrl)
          : undefined,
      });
    }
    const photoUrl = await fetchLinkedInPhoto(
      document,
      context.fallbackPhotoUrl,
    );
    if (DEBUG_LINKEDIN_PHOTO) {
      console.warn("[LinkedIn Photo] результат:", { gotPhoto: !!photoUrl });
    }
    return { photoUrl };
  }

  if (source === "HH" && context.profileUrl) {
    return fetchHHAssets(
      document,
      context.profileUrl,
      context.candidateName,
      context.fallbackPhotoUrl,
    );
  }

  return {};
}
