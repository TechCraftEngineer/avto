/**
 * Security headers middleware for Next.js applications
 * Adds various security headers to prevent common attacks
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Security configuration
 */
const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Next.js
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for Tailwind
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://api.deepseek.com",
        "https://openrouter.ai",
        // Примечание: Локальный AI провайдер использует пользовательский URL из LOCAL_API_URL
        // Если используется локальный провайдер, добавьте его URL в CSP вручную
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // Other security headers
  headers: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  },
};

/**
 * Generate CSP header value
 */
function generateCSPHeader(): string {
  const { directives } = SECURITY_CONFIG.csp;

  return Object.entries(directives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add Content Security Policy
  response.headers.set("Content-Security-Policy", generateCSPHeader());

  // Add other security headers
  Object.entries(SECURITY_CONFIG.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Security middleware for Next.js middleware
 */
export function securityMiddleware(_request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Add security headers
  addSecurityHeaders(response);

  return response;
}

/**
 * Security headers for API routes
 */
export function addAPISecurityHeaders(response: Response): Response {
  // API-specific CSP (more restrictive)
  const apiCSP =
    "default-src 'self'; script-src 'none'; style-src 'none'; img-src 'none'; font-src 'none'; connect-src 'self'";
  response.headers.set("Content-Security-Policy", apiCSP);

  // API-specific headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}
