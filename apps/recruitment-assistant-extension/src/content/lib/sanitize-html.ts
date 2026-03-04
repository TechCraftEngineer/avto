/**
 * Санитизация HTML на границе content-script перед отправкой.
 */

import DOMPurify from "dompurify";

const MAX_SANITIZED_HTML_LENGTH = 50000;

/**
 * Санитизирует и ограничивает HTML.
 * Возвращает undefined для пустых/невалидных результатов.
 */
export function sanitizeAndLimitHtml(
  html: string | null | undefined,
): string | undefined {
  if (html == null || typeof html !== "string") return undefined;
  const trimmed = html.trim();
  if (!trimmed) return undefined;

  const sanitized = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "span",
      "div",
      "ul",
      "ol",
      "li",
      "b",
      "i",
      "em",
      "strong",
    ],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });

  if (!sanitized.trim()) return undefined;
  return sanitized.length > MAX_SANITIZED_HTML_LENGTH
    ? sanitized.slice(0, MAX_SANITIZED_HTML_LENGTH)
    : sanitized;
}
