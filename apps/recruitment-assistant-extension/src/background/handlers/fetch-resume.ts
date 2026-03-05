/**
 * Обработчики FETCH_RESUME_PDF и FETCH_RESUME_TEXT
 */

const FETCH_TIMEOUT_MS = 15000;

import { log, logError } from "../lib";
import { isResumeHostAllowed } from "../lib/allowed-hosts";
import { extractDivResume } from "../lib/extract-resume";
import type { ServiceWorkerResponse } from "../types";

function validateResumeUrl(
  url: string,
  referer: string,
): { valid: boolean; error?: string } {
  try {
    const urlParsed = new URL(url);
    const refererParsed = new URL(referer);
    if (urlParsed.protocol !== "http:" && urlParsed.protocol !== "https:") {
      return { valid: false, error: "Разрешены только http и https" };
    }
    if (
      refererParsed.protocol !== "http:" &&
      refererParsed.protocol !== "https:"
    ) {
      return { valid: false, error: "Недопустимый Referer" };
    }
    const urlHost = urlParsed.hostname.toLowerCase();
    const refererHost = refererParsed.hostname.toLowerCase();
    if (!isResumeHostAllowed(urlHost)) {
      log("FETCH_RESUME blocked: url host not in allowlist", {
        url,
        host: urlHost,
      });
      return { valid: false, error: "URL не в списке разрешённых" };
    }
    if (!isResumeHostAllowed(refererHost)) {
      log("FETCH_RESUME blocked: referer host not in allowlist", {
        referer,
        host: refererHost,
      });
      return { valid: false, error: "Referer не в списке разрешённых" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Некорректный URL или Referer" };
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "manual",
    });
    if (
      response.type === "opaqueredirect" ||
      (response.status >= 300 && response.status < 400)
    ) {
      const location = response.headers.get("Location");
      throw new Error(
        `Редирект не разрешён: ${response.status}${location ? ` → ${location}` : ""}`,
      );
    }
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function handleFetchResumePdf(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const url = payload?.url;
  if (typeof url !== "string") {
    sendResponse({ success: false, error: "Неверный URL" });
    return;
  }

  const { valid, error } = validateResumeUrl(url, url);
  if (!valid) {
    sendResponse({ success: false, error });
    return;
  }

  try {
    log("Загрузка PDF резюме", { url });
    const response = await fetchWithTimeout(url, {
      credentials: "omit",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    const base64 = btoa(binary);
    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ||
      "application/pdf";

    sendResponse({ success: true, base64, contentType });
  } catch (err) {
    logError("FETCH_RESUME_PDF", err);
    sendResponse({
      success: false,
      error: err instanceof Error ? err.message : "Ошибка загрузки PDF",
    });
  }
}

export async function handleFetchResumeText(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const url = payload?.url;
  if (typeof url !== "string") {
    sendResponse({ success: false, error: "Неверный URL" });
    return;
  }
  const referer = typeof payload?.referer === "string" ? payload.referer : url;

  const { valid, error } = validateResumeUrl(url, referer);
  if (!valid) {
    sendResponse({ success: false, error });
    return;
  }

  try {
    log("Загрузка текстовой версии резюме", { url });
    const response = await fetchWithTimeout(url, {
      credentials: "omit",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: referer,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    if (html.includes("conversion_error")) {
      throw new Error("HH.ru: ошибка конвертации резюме");
    }

    const content = extractDivResume(html);
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const fallback = bodyMatch?.[1]?.trim();
      if (fallback && !fallback.includes("conversion_error")) {
        sendResponse({ success: true, data: fallback });
      } else {
        throw new Error("Не найден div.resume и body в HTML");
      }
    } else {
      sendResponse({ success: true, data: content });
    }
  } catch (err) {
    logError("FETCH_RESUME_TEXT", err);
    sendResponse({
      success: false,
      error: err instanceof Error ? err.message : "Ошибка загрузки",
    });
  }
}
