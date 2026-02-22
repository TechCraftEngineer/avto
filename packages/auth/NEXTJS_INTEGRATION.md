# Интеграция Better Auth с Next.js

## ✅ Текущая конфигурация

### Next.js версия: 16.1.6

Используем новый `proxy.ts` вместо `middleware.ts` (Next.js 16+).

### Серверная конфигурация

**packages/auth/src/index.ts**
```typescript
plugins: [
  emailOTP({ ... }),
  customSession({ ... }),
  nextCookies(), // ⚠️ Должен быть последним!
]
```

Плагин `nextCookies()` автоматически устанавливает cookies в Server Actions.

### Клиентская конфигурация

**apps/app/src/auth/client.ts**
```typescript
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  plugins: [emailOTPClient(), nextCookies()],
});
```

### API Route

**apps/app/src/app/api/auth/[...all]/route.ts**
```typescript
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "~/auth/server";

export const { GET, POST } = toNextJsHandler(auth);
```

## 🔒 Защита маршрутов

### Proxy (apps/app/src/proxy.ts)

Используем **cookie-based проверку** для оптимистичного редиректа:

```typescript
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  
  // ⚠️ ВАЖНО: Это НЕ безопасная проверка!
  // Только для оптимистичного редиректа
  // Полная валидация ОБЯЗАТЕЛЬНА в каждом route/page
  
  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
  
  return NextResponse.next();
}
```

### Защищенная страница (Server Component)

**Правильный способ:**

```typescript
import { auth } from "~/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // ✅ Полная валидация сессии с БД
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/auth/signin");
  }

  return <h1>Добро пожаловать, {session.user.name}</h1>;
}
```

### Server Action с cookies

```typescript
"use server";
import { auth } from "~/auth/server";

export async function signIn(email: string, password: string) {
  // ✅ nextCookies плагин автоматически установит cookies
  await auth.api.signInEmail({
    body: { email, password }
  });
}
```

### Получение сессии в Server Action

```typescript
"use server";
import { auth } from "~/auth/server";
import { headers } from "next/headers";

export async function someAuthenticatedAction() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session) {
    throw new Error("Не авторизован");
  }
  
  // Ваша логика
}
```

## ⚠️ Важные замечания

### 1. Cookie-based проверка НЕ безопасна

```typescript
// ❌ НЕ БЕЗОПАСНО для защиты данных
const sessionCookie = getSessionCookie(request);
if (sessionCookie) {
  // Любой может создать cookie вручную!
}

// ✅ БЕЗОПАСНО - валидация с БД
const session = await auth.api.getSession({ headers });
if (session) {
  // Сессия проверена в БД
}
```

### 2. RSC не могут обновлять cookie cache

Server Components не могут устанавливать cookies, поэтому cookie cache не обновится до взаимодействия через Server Actions или Route Handlers.

### 3. nextCookies должен быть последним

```typescript
plugins: [
  emailOTP(),
  customSession(),
  // ... другие плагины
  nextCookies(), // ⚠️ Всегда последним!
]
```

## 🚀 Альтернатива: Полная валидация в proxy

Для Next.js 16+ можно использовать полную валидацию в proxy:

```typescript
import { auth } from "~/auth/server";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {
  // ✅ Полная валидация с БД (медленнее, но безопаснее)
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}
```

**Компромисс:**
- Cookie-based: Быстро, но требует валидации в каждом route
- Full validation: Медленнее, но централизованная проверка

**Рекомендация:** Используйте cookie-based в proxy + полную валидацию в каждом защищенном route/page.

## 📚 Ссылки

- [Better Auth Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [Next.js 16 Proxy](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Better Auth Security](https://www.better-auth.com/docs/concepts/security)
