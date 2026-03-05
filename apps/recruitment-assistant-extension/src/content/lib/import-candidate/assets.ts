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

/** Проверяет, что URL — реальное фото LinkedIn (не placeholder) */
function isRealMediaUrl(url: string): boolean {
  return (
    url.includes("media.licdn.com") ||
    url.includes("licdn.com") ||
    url.includes("profile-displayphoto")
  );
}

/** Проверяет, что строка уже в формате data:image/...;base64,... */
function isDataUrlBase64(s: string): boolean {
  return /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(s);
}

/** Загружает фото для LinkedIn профиля.
 * Селектор: figure[data-view-name="image"] img (профильное фото).
 * Возвращает base64 data URL для импорта.
 */
async function fetchLinkedInPhoto(
  document: Document,
  fallbackPhotoUrl?: string,
): Promise<string | undefined> {
  const photoImg = document.querySelector<HTMLImageElement>(
    'figure[data-view-name="image"] img',
  );
  const srcAttr = photoImg?.getAttribute("src");
  const delayedUrl = photoImg?.getAttribute("data-delayed-url");
  const resolvedSrc = photoImg?.src;

  // LinkedIn lazy-load: data-delayed-url содержит реальный CDN URL,
  // а src может быть placeholder. Предпочитаем data-delayed-url на licdn.com
  let photoSrc: string | undefined;
  if (delayedUrl && isValidPhotoUrl(delayedUrl) && isRealMediaUrl(delayedUrl)) {
    photoSrc = delayedUrl;
  } else if (
    resolvedSrc &&
    isValidPhotoUrl(resolvedSrc) &&
    isRealMediaUrl(resolvedSrc)
  ) {
    photoSrc = resolvedSrc;
  } else {
    photoSrc =
      (resolvedSrc && isValidPhotoUrl(resolvedSrc) ? resolvedSrc : undefined) ||
      (srcAttr && isValidPhotoUrl(srcAttr) ? srcAttr : undefined) ||
      (delayedUrl && isValidPhotoUrl(delayedUrl) ? delayedUrl : undefined) ||
      (fallbackPhotoUrl && isValidPhotoUrl(fallbackPhotoUrl)
        ? fallbackPhotoUrl
        : undefined);
  }

  if (!isValidPhotoUrl(photoSrc ?? undefined)) return undefined;

  // Уже base64 — возвращаем как есть (API ожидает data:image/...;base64,...)
  if (photoSrc && isDataUrlBase64(photoSrc)) {
    return photoSrc;
  }

  const urlToFetch = photoSrc;
  if (!urlToFetch) return undefined;

  try {
    const { fetchImageAsBase64ViaExtension } = await import(
      "../../../parsers/hh-employer/fetch-resume-html"
    );
    const { base64, contentType } =
      await fetchImageAsBase64ViaExtension(urlToFetch);
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.error(
      "[fetchLinkedInPhoto] fetchImageAsBase64ViaExtension failed",
      {
        host: safeHost(urlToFetch),
        hasPhoto: !!urlToFetch,
        message: err instanceof Error ? err.message : String(err),
      },
    );
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
    const photoUrl = await fetchLinkedInPhoto(
      document,
      context.fallbackPhotoUrl,
    );
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
