"use client";

import sanitizeHtml from "sanitize-html";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  // Sanitize HTML to prevent XSS attacks
  const sanitizedHtml = sanitizeHtml(html, {
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
      "a",
      "span",
      "div",
      "blockquote",
      "code",
      "pre",
    ],
    allowedAttributes: {
      "a": ["href", "title", "target", "class"],
      "span": ["class"],
      "div": ["class"],
      "code": ["class"],
      "pre": ["class"],
    },
    allowedIframeHostnames: [],
    allowedSchemes: ["http", "https", "mailto", "tel", "callto", "cid", "xmpp", "data"],
    allowedSchemesAppliedToAttributes: ["href", "src", "cite"],
  });

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
