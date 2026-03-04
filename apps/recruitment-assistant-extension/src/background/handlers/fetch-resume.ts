/**
 * Обработчики FETCH_RESUME_PDF и FETCH_RESUME_TEXT
 */

import { log, logError } from "../lib";
import { extractDivResume } from "../lib/extract-resume";
import type { ServiceWorkerResponse } from "../types";

export async function handleFetchResumePdf(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const url = payload?.url;
  if (typeof url !== "string") {
    sendResponse({ success: false, error: "Неверный URL" });
    return;
  }

  try {
    log("Загрузка PDF резюме", { url });
    const response = await fetch(url, {
      credentials: "include",
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

  try {
    log("Загрузка текстовой версии резюме", { url });
    const response = await fetch(url, {
      credentials: "include",
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
