import { paths } from "@qbs-autonaim/config";
import { RATE_LIMITS, rateLimit } from "@qbs-autonaim/server-utils";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { pathnameSchema } from "~/lib/pathname-schema";

const ENABLE_CSP = process.env.ENABLE_CSP === "true";
const CSP_REPORT_ONLY = process.env.CSP_REPORT_ONLY === "true";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Передаем pathname в headers для использования в layouts
  // Валидируем pathname перед установкой в header
  const pathnameValidation = pathnameSchema.safeParse(request.nextUrl.pathname);
  if (pathnameValidation.success) {
    response.headers.set("x-pathname", pathnameValidation.data);
  } else {
    // Логируем ошибку валидации и используем безопасное значение по умолчанию
    console.warn(
      "[Security] Invalid pathname detected:",
      request.nextUrl.pathname,
      pathnameValidation.error.issues,
    );
    response.headers.set("x-pathname", "/");
  }

  // Настройка CSP на основе переменных окружения
  if (ENABLE_CSP || CSP_REPORT_ONLY) {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TODO: заменить на nonce-based
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    const headerName = CSP_REPORT_ONLY
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";

    response.headers.set(headerName, cspDirectives);
  }

  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Публичные маршруты (не требуют аутентификации)
  // /auth/verify-email доступен всем (и авторизованным, и нет)
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

    // Исключаем streaming endpoints и webhooks из rate limiting или применяем более высокие лимиты
    const isStreamEndpoint =
      request.nextUrl.pathname.startsWith("/api/vacancy/chat-generate") ||
      request.nextUrl.pathname.startsWith("/api/chat/stream");

    const isWebhook = request.nextUrl.pathname.startsWith("/api/webhook/");
    const isHealthCheck = request.nextUrl.pathname === "/api/health";

    // Пропускаем rate limiting для специальных endpoints
    if (isStreamEndpoint || isWebhook || isHealthCheck) {
      return response;
    }

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
            Math.max(
              0,
              Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
            ),
          ),
        },
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
