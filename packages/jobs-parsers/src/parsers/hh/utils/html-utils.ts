import sanitizeHtml from "sanitize-html";

/**
 * Удаляет из HTML все атрибуты (class, style, id и т.д.), оставляя только голые теги.
 * Результат передаётся AI-боту для извлечения данных.
 */
export function stripHtmlToBareTags(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "span",
      "div",
      "section",
      "article",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ]),
    allowedAttributes: {},
    allowedStyles: {},
  });
}
