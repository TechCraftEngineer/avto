/**
 * Обработчик FETCH_IMAGE
 */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

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
      credentials: "omit", // CDN профильных фото не требуют auth, omit обходит CORS * vs credentials
      headers: { Accept: "image/*" },
      redirect: "error",
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.toLowerCase().startsWith("image/")) {
      throw new Error(
        `Недопустимый content-type: ожидалось image/*, получено ${contentType ?? "неизвестно"}`,
      );
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength != null) {
      const size = parseInt(contentLength, 10);
      if (!Number.isNaN(size) && size > MAX_IMAGE_BYTES) {
        throw new Error(
          `Изображение слишком большое: ${size} байт (макс. ${MAX_IMAGE_BYTES})`,
        );
      }
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Тело ответа отсутствует");
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
      if (totalBytes > MAX_IMAGE_BYTES) {
        reader.cancel();
        throw new Error(
          `Изображение слишком большое: превышен лимит ${MAX_IMAGE_BYTES} байт при потоковой загрузке`,
        );
      }
      chunks.push(value);
    }
    const bytes = (() => {
      const total = chunks.reduce((sum, c) => sum + c.length, 0);
      const arr = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        arr.set(c, offset);
        offset += c.length;
      }
      return arr;
    })();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(
        `Изображение слишком большое: ${bytes.byteLength} байт (макс. ${MAX_IMAGE_BYTES})`,
      );
    }

    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    const base64 = btoa(binary);
    const contentTypeValue = contentType.split(";")[0]?.trim() || "image/jpeg";

    sendResponse({ success: true, base64, contentType: contentTypeValue });
  } catch (err) {
    logError("FETCH_IMAGE", err);
    sendResponse({
      success: false,
      error: err instanceof Error ? err.message : "Ошибка загрузки фото",
    });
  }
}
