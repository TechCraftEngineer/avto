/**
 * Обработчик FETCH_IMAGE
 */

import { log, logError } from "../lib";
import { isImageHostAllowed } from "../lib/allowed-hosts";
import type { ServiceWorkerResponse } from "../types";

export function validateImageUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, error: "Неверный или запрещённый URL" };
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    log("FETCH_IMAGE blocked: invalid protocol", { url });
    return { valid: false, error: "Неверный или запрещённый URL" };
  }
  const imageHost = parsedUrl.hostname.toLowerCase();
  if (!isImageHostAllowed(imageHost)) {
    log("FETCH_IMAGE blocked: host not in allowlist", { url, host: imageHost });
    return { valid: false, error: "Неверный или запрещённый URL" };
  }
  return { valid: true };
}

export async function handleFetchImage(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const url = payload?.url;
  if (typeof url !== "string") {
    sendResponse({ success: false, error: "Неверный URL" });
    return;
  }

  const { valid, error } = validateImageUrl(url);
  if (!valid) {
    sendResponse({ success: false, error });
    return;
  }

  try {
    log("Загрузка изображения", { url });
    const response = await fetch(url, {
      credentials: "include",
      headers: { Accept: "image/*" },
      redirect: "error",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    const base64 = btoa(binary);
    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ||
      "image/jpeg";

    sendResponse({ success: true, base64, contentType });
  } catch (err) {
    logError("FETCH_IMAGE", err);
    sendResponse({
      success: false,
      error: err instanceof Error ? err.message : "Ошибка загрузки фото",
    });
  }
}
