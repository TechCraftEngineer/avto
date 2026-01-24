import { paths } from "@qbs-autonaim/config";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

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

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
