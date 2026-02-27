/**
 * Утилита конвертации HTML в PDF через Gotenberg
 * @see https://gotenberg.dev/docs/convert-with-chromium/convert-html-to-pdf
 */

import { env } from "@qbs-autonaim/config";
import slugify from "@sindresorhus/slugify";

const GOTENBERG_ENDPOINT = "/forms/chromium/convert/html";

export interface ConvertHtmlToPdfOptions {
  html: string;
  filename?: string;
}

/**
 * Конвертирует HTML в PDF через Gotenberg API
 */
export async function convertHtmlToPdf(
  options: ConvertHtmlToPdfOptions,
): Promise<Buffer> {
  const { html, filename = "document" } = options;
  const baseUrl = env.GOTENBERG_URL ?? "http://localhost:3010";
  const url = `${baseUrl.replace(/\/$/, "")}${GOTENBERG_ENDPOINT}`;

  const formData = new FormData();
  const htmlBlob = new Blob([html], { type: "text/html" });
  formData.append("files", htmlBlob, "index.html");

  // HTTP headers must be ASCII-only; slugify transliterates Cyrillic etc.
  const base =
    slugify(filename.replace(/\.pdf$/i, ""), { lowercase: false }) ||
    "document";

  const headers: Record<string, string> = {
    "Gotenberg-Output-Filename": base,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error(
          `Gotenberg timeout (10s): ${url} — сервис не ответил вовремя`,
        );
      }
      throw new Error(`Gotenberg network error: ${url} — ${err.message}`);
    }
    throw err;
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Gotenberg error ${response.status}: ${text || response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
