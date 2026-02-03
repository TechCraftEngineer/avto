import sanitizeHtml from "sanitize-html";

/**
 * Санитизация HTML для предотвращения XSS атак
 */
export function sanitizeHtmlFunction(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "i",
      "b",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "span",
      "div",
    ],
    allowedAttributes: {
      span: ["class"],
      div: ["class"],
      code: ["class"],
      pre: ["class"],
    },
  });
}
