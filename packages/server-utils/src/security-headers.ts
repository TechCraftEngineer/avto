/**
 * Security headers for API routes
 * Adds security headers to prevent common attacks
 */

/**
 * Add security headers to API response
 */
export function addAPISecurityHeaders(response: Response): Response {
  const apiCSP =
    "default-src 'self'; script-src 'none'; style-src 'none'; img-src 'none'; font-src 'none'; connect-src 'self'";
  response.headers.set("Content-Security-Policy", apiCSP);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}
