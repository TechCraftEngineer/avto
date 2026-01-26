import { paths } from "@qbs-autonaim/config";
import { RATE_LIMITS, rateLimit } from "@qbs-autonaim/server-utils";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Generate cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Build CSP with nonce for script execution
 */
function buildCSPWithNonce(nonce: string): string {
  // In development, use less restrictive CSP
  const isDevelopment = process.env.NODE_ENV === 'development';

  const directives = [
    "default-src 'self'",
    isDevelopment
      ? `script-src 'nonce-${nonce}' 'self' 'unsafe-inline' 'unsafe-eval' https:`
      : `script-src 'nonce-${nonce}' 'self' https:`,
    "style-src 'self' 'unsafe-inline'", // Keep unsafe-inline for styles (Tailwind CSS)
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://api.deepseek.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

export async function proxy(request: NextRequest) {
  // Generate nonce for this request
  const nonce = generateNonce();

  // Build CSP with nonce
  const csp = buildCSPWithNonce(nonce);

  // Create request headers with nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Create response with modified request headers
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });

  // Set CSP header on response
  response.headers.set("Content-Security-Policy", csp);


  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Публичные маршруты (не требуют аутентификации)
  const publicPaths = ["/auth", "/api", "/invite"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Если нет cookie сессии и пытается зайти на защищенный маршрут
  if (!sessionCookie && !isPublicPath) {
    const signInUrl = new URL(paths.auth.signin, request.url);
    // Сохраняем redirect только для не-корневых путей
    if (
      pathname !== "/" &&
      pathname !== "/onboarding" &&
      pathname !== "/invitations"
    ) {
      signInUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(signInUrl);
  }

  // Если есть cookie сессии и пытается зайти на страницы авторизации
  // НЕ редиректим автоматически - пусть auth/layout решает
  // Это предотвращает циклы когда сессия невалидна

  // Apply security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Different rate limits for different endpoints
    let rateLimitConfig: { limit: number; windowMs: number } =
      RATE_LIMITS.api.default;
    if (request.nextUrl.pathname.startsWith("/api/auth/")) {
      rateLimitConfig = RATE_LIMITS.auth.signIn;
    }

    const rateLimitResult = rateLimit(
      clientIP,
      rateLimitConfig.limit,
      rateLimitConfig.windowMs,
    );

    // Set rate limit headers
    response.headers.set("X-Rate-Limit-Limit", String(rateLimitConfig.limit));
    response.headers.set(
      "X-Rate-Limit-Remaining",
      String(rateLimitResult.remaining),
    );
    response.headers.set(
      "X-Rate-Limit-Reset",
      String(rateLimitResult.resetTime),
    );

    // Return 429 if rate limit exceeded
    if (!rateLimitResult.success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          "Retry-After": String(
            Math.max(0, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          ),
        },
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ],
};
