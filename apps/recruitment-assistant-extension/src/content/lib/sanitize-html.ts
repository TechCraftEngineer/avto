/**
 * Санитизация HTML на границе content-script перед отправкой.
 */

import DOMPurify from "dompurify";

const MAX_SANITIZED_HTML_LENGTH = 50000;

export interface LinkedInHtmlAdapter {
  getSkillsHtml?: () => string | null;
  getContactsHtml?: () => string | null;
}

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

/**
 * Извлекает и санитизирует HTML-поля (skills, contacts) из LinkedIn-адаптера.
 * Возвращает undefined для полей, которые отсутствуют или невалидны.
 */
export function extractAndSanitizeLinkedInHtml(
  adapter: LinkedInHtmlAdapter | null,
): { skillsHtml?: string; contactsHtml?: string } {
  if (!adapter) return {};
  let rawSkills: string | null | undefined;
  let rawContacts: string | null | undefined;
  try {
    rawSkills = adapter.getSkillsHtml?.() ?? undefined;
  } catch (e) {
    console.warn("[sanitize-html] getSkillsHtml failed:", e);
    rawSkills = undefined;
  }
  try {
    rawContacts = adapter.getContactsHtml?.() ?? undefined;
  } catch (e) {
    console.warn("[sanitize-html] getContactsHtml failed:", e);
    rawContacts = undefined;
  }
  return {
    skillsHtml: sanitizeAndLimitHtml(rawSkills) ?? undefined,
    contactsHtml: sanitizeAndLimitHtml(rawContacts) ?? undefined,
  };
}
