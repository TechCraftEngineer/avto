// Пример защиты source maps (не используется, только для справки)
// Если нужно включить productionBrowserSourceMaps: true,
// добавьте эту логику в основной middleware

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function protectSourceMaps(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Блокируем доступ к .map файлам для неавторизованных пользователей
  if (pathname.endsWith(".map")) {
    // Проверка авторизации (пример)
    const authToken = request.headers.get("authorization");
    const isAuthorized = authToken === process.env.SOURCEMAP_ACCESS_TOKEN;

    if (!isAuthorized) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
}
