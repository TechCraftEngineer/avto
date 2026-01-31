import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes HTML content to prevent XSS attacks and CSP violations
 * Allows only safe HTML tags and removes all potentially dangerous content
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
