/**
 * Проверяет, что строка — placeholder (Load more, See more и т.п.).
 * Используется при парсинге LinkedIn для фильтрации пустого/ленивого контента.
 */
const PLACEHOLDER_PATTERN = /^(load\s*more|show\s*more|see\s*more)\.?\s*$/i;

export function isPlaceholderText(text: string): boolean {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return true;
  return PLACEHOLDER_PATTERN.test(trimmed);
}

/**
 * Проверяет, что HTML — placeholder (Load more, пустые обёртки) или пустой.
 */
export function isPlaceholderHtml(html: string | undefined | null): boolean {
  if (!html || typeof html !== "string") return true;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return isPlaceholderText(text);
}

/**
 * Проверяет, что HTML содержит осмысленный контент (не placeholder и не пустой).
 */
export function isMeaningfulHtml(html: string | undefined): boolean {
  if (!html || typeof html !== "string") return false;
  return !isPlaceholderHtml(html);
}

/** Проверяет, что строка — валидный http/https URL */
export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
