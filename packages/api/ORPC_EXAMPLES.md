# Примеры использования oRPC

Данный документ содержит практические примеры использования oRPC в проекте после миграции с tRPC.

## Содержание

1. [Простая query процедура](#простая-query-процедура)
2. [Mutation процедура](#mutation-процедура)
3. [Процедура с middleware](#процедура-с-middleware)
4. [Вложенный роутер](#вложенный-роутер)
5. [Использование на клиенте](#использование-на-клиенте)
6. [Server-side prefetch](#server-side-prefetch)
7. [Оптимистичные обновления](#оптимистичные-обновления)

---

## Простая query процедура

Query процедуры используются для чтения данных (аналог GET запросов).

### Пример: Получение списка workspace

```typescript
// packages/api/src/routers/workspace/list.ts
import { protectedProcedure } from "../../orpc";

/**
 * Получение списка workspace текущего пользователя
 * Требует авторизации
 */
export const list = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.session.user.id;
  
  const workspaces = await ctx.workspaceRepository.findByUserId(userId);
  
  return workspaces;
});
```

### Пример: Получение одного workspace с валидацией

```typescript
// packages/api/src/routers/workspace/get.ts
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";

/**
 * Получение workspace по ID
 * Проверяет существование и права доступа
 */
export const get = protectedProcedure
  .input(z.object({ 
    id: workspaceIdSchema 
  }))
  .query(async ({ input, ctx }) => {
    // 1. Проверка существования
    const workspace = await ctx.workspaceRepository.findById(input.id);
    
    if (!workspace) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Рабочая область не найдена",
      });
    }
    
    // 2. Проверка прав доступа
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.id,
      ctx.session.user.id
    );
    
    if (!hasAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к рабочей области",
      });
    }
    
    return workspace;
  });
```

### Ключевые отличия от tRPC

- Импорт `protectedProcedure` из `../../orpc` вместо `../../trpc`
- Использование `ORPCError` вместо `TRPCError`
- Синтаксис и API остаются идентичными

---

## Mutation процедура

Mutation процедуры используются для изменения данных (аналог POST/PUT/DELETE запросов).

### Пример: Создание workspace

```typescript
// packages/api/src/routers/workspace/create.ts
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { ORPCError } from "@orpc/server";

/**
 * Создание новой рабочей области
 * Требует авторизации
 */
export const create = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1, "Название не может быть пустым").max(100, "Максимальная длина названия - 100 символов"),
      slug: z.string().min(3, "Минимальная длина идентификатора - 3 символа").max(50, "Максимальная длина идентификатора - 50 символов"),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    
    // Проверка уникальности slug
    const existing = await ctx.workspaceRepository.findBySlug(input.slug);
    if (existing) {
      throw new ORPCError({
        code: "CONFLICT",
        message: "Рабочая область с таким идентификатором уже существует",
      });
    }
    
    // Создание workspace
    const workspace = await ctx.db.workspace.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        ownerId: userId,
      },
    });
    
    // Логирование для аудита (автоматически через middleware)
    return workspace;
  });
```

### Пример: Обновление workspace

```typescript
// packages/api/src/routers/workspace/update.ts
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";

export const update = protectedProcedure
  .input(
    z.object({
      id: workspaceIdSchema,
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Проверка существования и доступа
    const workspace = await ctx.workspaceRepository.findById(input.id);
    
    if (!workspace) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Рабочая область не найдена",
      });
    }
    
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.id,
      ctx.session.user.id
    );
    
    if (!hasAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к рабочей области",
      });
    }
    
    // Обновление
    const updated = await ctx.db.workspace.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });
    
    return updated;
  });
```

---

## Процедура с middleware

Все процедуры автоматически используют middleware через `publicProcedure` и `protectedProcedure`.

### Встроенные middleware

```typescript
// packages/api/src/orpc.ts

// publicProcedure - с базовыми middleware
export const publicProcedure = procedure
  .use(timingMiddleware)           // Логирование времени выполнения
  .use(securityHeadersMiddleware)  // Security headers
  .use(securityAudit);             // Аудит безопасности

// protectedProcedure - с проверкой авторизации
export const protectedProcedure = publicProcedure
  .use(
    middleware(({ ctx, next }) => {
      if (!ctx.session?.user) {
        throw new ORPCError({
          code: "UNAUTHORIZED",
          message: "Требуется авторизация",
        });
      }
      
      return next({
        ctx: {
          ...ctx,
          session: { ...ctx.session, user: ctx.session.user },
        },
      });
    })
  );
```

### Пример: Кастомный middleware для rate limiting

```typescript
// packages/api/src/middleware/rate-limit.ts
import { middleware } from "../orpc";
import { ORPCError } from "@orpc/server";

export const rateLimitMiddleware = middleware(async ({ ctx, next }) => {
  const userId = ctx.session?.user?.id;
  const ipAddress = ctx.ipAddress;
  
  // Проверка rate limit
  const isAllowed = await checkRateLimit(userId || ipAddress);
  
  if (!isAllowed) {
    throw new ORPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Превышен лимит запросов. Попробуйте позже",
    });
  }
  
  return next();
});

// Использование в процедуре
export const expensiveOperation = protectedProcedure
  .use(rateLimitMiddleware)
  .mutation(async ({ ctx }) => {
    // Операция с rate limiting
  });
```

---

## Вложенный роутер

Вложенные роутеры используются для группировки связанной функциональности.

### Пример: Workspace с вложенными роутерами

```typescript
// packages/api/src/routers/workspace/members/list.ts
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { workspaceIdSchema } from "@qbs-autonaim/validators";

export const list = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id
    );
    
    if (!hasAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к рабочей области",
      });
    }
    
    // Получение списка участников
    const members = await ctx.db.workspaceMember.findMany({
      where: { workspaceId: input.workspaceId },
      include: { user: true },
    });
    
    return members;
  });
```

```typescript
// packages/api/src/routers/workspace/members/add.ts
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";

export const add = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      userId: z.string(),
      role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Проверка прав (только владелец или админ может добавлять)
    const member = await ctx.db.workspaceMember.findFirst({
      where: {
        workspaceId: input.workspaceId,
        userId: ctx.session.user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });
    
    if (!member) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для добавления участников",
      });
    }
    
    // Добавление участника
    const newMember = await ctx.db.workspaceMember.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: input.role,
      },
    });
    
    return newMember;
  });
```

```typescript
// packages/api/src/routers/workspace/members/index.ts
import type { ORPCRouterRecord } from "@orpc/server";

import { add } from "./add";
import { list } from "./list";
import { remove } from "./remove";
import { updateRole } from "./update-role";

export const membersRouter = {
  list,
  add,
  remove,
  updateRole,
} satisfies ORPCRouterRecord;
```

```typescript
// packages/api/src/routers/workspace/index.ts
import type { ORPCRouterRecord } from "@orpc/server";

import { create } from "./create";
import { get } from "./get";
import { list } from "./list";
import { update } from "./update";
import { membersRouter } from "./members";
import { invitesRouter } from "./invites";

export const workspaceRouter = {
  list,
  get,
  create,
  update,
  
  // Вложенные роутеры
  members: membersRouter,
  invites: invitesRouter,
} satisfies ORPCRouterRecord;
```


### Использование вложенных роутеров на клиенте

```typescript
// Вызов процедуры из вложенного роутера
const { data } = useQuery(
  orpc.workspace.members.list.queryOptions({
    workspaceId: "ws_123",
  })
);
```

---

## Использование на клиенте

### Базовая настройка

```typescript
// apps/app/src/orpc/react.tsx
"use client";

import type { AppRouter } from "@qbs-autonaim/api";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createORPCClient,
  httpBatchStreamLink,
} from "@orpc/client";
import { createORPCContext } from "@orpc/tanstack-react-query";
import { useState } from "react";
import SuperJSON from "superjson";

export const { useORPC, useORPCClient, ORPCProvider } =
  createORPCContext<AppRouter>();

export function ORPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [orpcClient] = useState(() =>
    createORPCClient<AppRouter>({
      links: [
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: `${getBaseUrl()}/api/orpc`,
          headers() {
            const headers = new Headers();
            headers.set("x-orpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ORPCProvider orpcClient={orpcClient} queryClient={queryClient}>
        {props.children}
      </ORPCProvider>
    </QueryClientProvider>
  );
}
```

### Query на клиенте с TanStack Query

**Validates: Requirements 14.4**

TanStack Query интегрируется с oRPC через фабрики `queryOptions` и `mutationOptions`, обеспечивая типобезопасность и автоматическое управление кэшем.

#### Базовый пример query

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useQuery } from "@tanstack/react-query";

export function WorkspaceList() {
  const orpc = useORPC();
  
  // queryOptions() возвращает типизированную конфигурацию для TanStack Query
  const { data, isPending, error, refetch } = useQuery(
    orpc.workspace.list.queryOptions()
  );
  
  if (isPending) {
    return <div>Загрузка...</div>;
  }
  
  if (error) {
    return <div>Ошибка: {error.message}</div>;
  }
  
  return (
    <div>
      <button onClick={() => refetch()}>Обновить</button>
      <ul>
        {data.map((workspace) => (
          <li key={workspace.id}>{workspace.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### Query с параметрами

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useQuery } from "@tanstack/react-query";

export function WorkspaceDetails({ workspaceId }: { workspaceId: string }) {
  const orpc = useORPC();
  
  const { data, isPending } = useQuery(
    orpc.workspace.get.queryOptions({ id: workspaceId })
  );
  
  if (isPending) {
    return <div>Загрузка...</div>;
  }
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
    </div>
  );
}
```

#### Условные запросы с skipToken

```typescript
import { useORPC } from "~/orpc/react";
import { useQuery, skipToken } from "@tanstack/react-query";

export function WorkspaceDetails({ workspaceId }: { workspaceId?: string }) {
  const orpc = useORPC();
  
  // skipToken предотвращает выполнение запроса пока workspaceId не определен
  const { data } = useQuery(
    workspaceId
      ? orpc.workspace.get.queryOptions({ id: workspaceId })
      : skipToken
  );
  
  if (!workspaceId) {
    return <div>Выберите рабочую область</div>;
  }
  
  return <div>{data?.name}</div>;
}
```

#### Использование useSuspenseQuery

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

function WorkspaceContent({ workspaceId }: { workspaceId: string }) {
  const orpc = useORPC();
  
  // useSuspenseQuery автоматически приостанавливает рендеринг до загрузки данных
  const { data } = useSuspenseQuery(
    orpc.workspace.get.queryOptions({ id: workspaceId })
  );
  
  return <div>{data.name}</div>;
}

export function WorkspacePage({ workspaceId }: { workspaceId: string }) {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <WorkspaceContent workspaceId={workspaceId} />
    </Suspense>
  );
}
```

#### Infinite Query для пагинации

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useInfiniteQuery } from "@tanstack/react-query";

export function VacancyList() {
  const orpc = useORPC();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...orpc.vacancy.list.queryOptions({
      limit: 20,
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
  });
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.items.map((vacancy) => (
            <div key={vacancy.id}>{vacancy.title}</div>
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Загрузка..." : "Загрузить ещё"}
        </button>
      )}
    </div>
  );
}
```

### Mutation на клиенте с TanStack Query

#### Базовый пример mutation

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function CreateWorkspaceForm() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  const { mutate, isPending } = useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Рабочая область создана");
        
        // Инвалидация списка workspace для обновления UI
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });
      },
      onError: (error) => {
        // Обработка ошибок с русскими сообщениями
        switch (error.code) {
          case "CONFLICT":
            toast.error("Рабочая область с таким идентификатором уже существует");
            break;
          case "BAD_REQUEST":
            if (error.data?.zodError) {
              const fieldErrors = error.data.zodError.fieldErrors;
              Object.entries(fieldErrors).forEach(([field, errors]) => {
                toast.error(`${field}: ${errors?.join(", ")}`);
              });
            } else {
              toast.error(error.message);
            }
            break;
          default:
            toast.error("Не удалось создать рабочую область");
        }
      },
    })
  );
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    mutate({
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Название..." required />
      <input name="slug" placeholder="Идентификатор..." required />
      <textarea name="description" placeholder="Описание..." />
      <button type="submit" disabled={isPending}>
        {isPending ? "Создание..." : "Создать"}
      </button>
    </form>
  );
}
```

#### Mutation с множественной инвалидацией

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteWorkspace() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    orpc.workspace.delete.mutationOptions({
      onSuccess: (_, variables) => {
        // Инвалидация нескольких связанных запросов
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });
        
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.get.queryKey({ id: variables.id }),
        });
        
        // Инвалидация всех запросов связанных с workspace
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key[0] === "workspace";
          },
        });
      },
    })
  );
}
```


---

## Server-side prefetch

**Validates: Requirements 14.6**

Server-side prefetch позволяет загружать данные на сервере и передавать их клиенту для мгновенного отображения, улучшая воспринимаемую производительность и SEO.

### Настройка серверных хелперов

```typescript
// apps/app/src/orpc/server.ts
import "server-only";

import { cache } from "react";
import { createORPCClient, httpBatchStreamLink } from "@orpc/client";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@qbs-autonaim/api";
import SuperJSON from "superjson";
import { auth } from "~/auth/server";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

// Кэшируем QueryClient для переиспользования в рамках одного запроса
export const getQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Данные не устаревают на сервере
        staleTime: Infinity,
      },
    },
  });
});

// Кэшируем oRPC клиент для переиспользования
const getORPCClient = cache(() => {
  return createORPCClient<AppRouter>({
    links: [
      httpBatchStreamLink({
        transformer: SuperJSON,
        url: `${getBaseUrl()}/api/orpc`,
        headers: async () => {
          const session = await auth();
          const headers = new Headers();
          headers.set("x-orpc-source", "nextjs-server");
          
          // Передаем авторизацию если есть сессия
          if (session?.user) {
            headers.set("authorization", `Bearer ${session.user.id}`);
          }
          
          return headers;
        },
      }),
    ],
  });
});

/**
 * Серверный хелпер для prefetch данных
 * Использует типизированный oRPC клиент
 */
export const orpcServer = () => {
  const client = getORPCClient();
  const queryClient = getQueryClient();
  
  return {
    workspace: {
      list: {
        prefetch: async () => {
          await queryClient.prefetchQuery({
            queryKey: ["workspace", "list"],
            queryFn: () => client.workspace.list.query(),
          });
        },
      },
      get: {
        prefetch: async (input: { id: string }) => {
          await queryClient.prefetchQuery({
            queryKey: ["workspace", "get", input],
            queryFn: () => client.workspace.get.query(input),
          });
        },
      },
    },
    vacancy: {
      list: {
        prefetch: async (input: { workspaceId: string; limit?: number }) => {
          await queryClient.prefetchQuery({
            queryKey: ["vacancy", "list", input],
            queryFn: () => client.vacancy.list.query(input),
          });
        },
      },
    },
  };
};
```

### Базовый пример prefetch в Server Component

```typescript
// apps/app/src/app/workspaces/page.tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, orpcServer } from "~/orpc/server";
import { WorkspaceList } from "./workspace-list";

export default async function WorkspacesPage() {
  const queryClient = getQueryClient();
  const server = orpcServer();
  
  // Загружаем данные на сервере
  await server.workspace.list.prefetch();
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceList />
    </HydrationBoundary>
  );
}
```

```typescript
// apps/app/src/app/workspaces/workspace-list.tsx
"use client";

import { useORPC } from "~/orpc/react";
import { useQuery } from "@tanstack/react-query";

export function WorkspaceList() {
  const orpc = useORPC();
  
  // Данные уже загружены на сервере, отображаются мгновенно
  // isPending будет false, данные доступны сразу
  const { data, isPending } = useQuery(orpc.workspace.list.queryOptions());
  
  if (isPending) {
    // Этот блок не выполнится благодаря prefetch
    return <div>Загрузка...</div>;
  }
  
  return (
    <ul>
      {data.map((workspace) => (
        <li key={workspace.id}>{workspace.name}</li>
      ))}
    </ul>
  );
}
```

### Prefetch с параметрами из URL

```typescript
// apps/app/src/app/workspaces/[id]/page.tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, orpcServer } from "~/orpc/server";
import { WorkspaceDetails } from "./workspace-details";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function WorkspacePage({ params }: PageProps) {
  const queryClient = getQueryClient();
  const server = orpcServer();
  
  try {
    // Загружаем данные workspace на сервере
    await server.workspace.get.prefetch({ id: params.id });
  } catch (error) {
    // Если workspace не найден, показываем 404
    notFound();
  }
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceDetails workspaceId={params.id} />
    </HydrationBoundary>
  );
}
```

```typescript
// apps/app/src/app/workspaces/[id]/workspace-details.tsx
"use client";

import { useORPC } from "~/orpc/react";
import { useQuery } from "@tanstack/react-query";

export function WorkspaceDetails({ workspaceId }: { workspaceId: string }) {
  const orpc = useORPC();
  
  const { data } = useQuery(
    orpc.workspace.get.queryOptions({ id: workspaceId })
  );
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
    </div>
  );
}
```

### Множественный prefetch

```typescript
// apps/app/src/app/dashboard/page.tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, orpcServer } from "~/orpc/server";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const queryClient = getQueryClient();
  const server = orpcServer();
  
  // Загружаем несколько запросов параллельно
  await Promise.all([
    server.workspace.list.prefetch(),
    server.vacancy.list.prefetch({ workspaceId: "current", limit: 10 }),
    // Можно добавить больше prefetch запросов
  ]);
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
```

### Prefetch с обработкой ошибок

```typescript
// apps/app/src/app/workspaces/[id]/page.tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, orpcServer } from "~/orpc/server";
import { WorkspaceDetails } from "./workspace-details";
import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
  searchParams: { fallback?: string };
}

export default async function WorkspacePage({ params, searchParams }: PageProps) {
  const queryClient = getQueryClient();
  const server = orpcServer();
  
  try {
    await server.workspace.get.prefetch({ id: params.id });
  } catch (error: any) {
    // Обработка различных ошибок
    if (error.code === "NOT_FOUND") {
      // Редирект на страницу со списком
      redirect("/workspaces");
    }
    
    if (error.code === "FORBIDDEN") {
      // Редирект на страницу с ошибкой доступа
      redirect("/access-denied");
    }
    
    // Для других ошибок пробрасываем дальше
    throw error;
  }
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceDetails workspaceId={params.id} />
    </HydrationBoundary>
  );
}
```

### Условный prefetch

```typescript
// apps/app/src/app/profile/page.tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, orpcServer } from "~/orpc/server";
import { auth } from "~/auth/server";
import { ProfileContent } from "./profile-content";

export default async function ProfilePage() {
  const queryClient = getQueryClient();
  const server = orpcServer();
  const session = await auth();
  
  // Prefetch только для авторизованных пользователей
  if (session?.user) {
    await Promise.all([
      server.user.me.prefetch(),
      server.workspace.list.prefetch(),
    ]);
  }
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileContent />
    </HydrationBoundary>
  );
}
```

### Prefetch с useSuspenseQuery

```typescript
// apps/app/src/app/workspaces/[id]/page.tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, orpcServer } from "~/orpc/server";
import { Suspense } from "react";
import { WorkspaceContent } from "./workspace-content";

export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const queryClient = getQueryClient();
  const server = orpcServer();
  
  // Prefetch для мгновенного отображения
  await server.workspace.get.prefetch({ id: params.id });
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Загрузка...</div>}>
        <WorkspaceContent workspaceId={params.id} />
      </Suspense>
    </HydrationBoundary>
  );
}
```

```typescript
// apps/app/src/app/workspaces/[id]/workspace-content.tsx
"use client";

import { useORPC } from "~/orpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";

export function WorkspaceContent({ workspaceId }: { workspaceId: string }) {
  const orpc = useORPC();
  
  // useSuspenseQuery + prefetch = мгновенное отображение без loading state
  const { data } = useSuspenseQuery(
    orpc.workspace.get.queryOptions({ id: workspaceId })
  );
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
    </div>
  );
}
```

### Преимущества server-side prefetch

1. **Мгновенное отображение**: Данные доступны сразу при первом рендере
2. **Улучшенное SEO**: Контент доступен для поисковых роботов
3. **Меньше layout shift**: UI не "прыгает" при загрузке данных
4. **Лучший UX**: Пользователь видит контент быстрее
5. **Параллельная загрузка**: Можно загружать несколько запросов одновременно

---

## Оптимистичные обновления

**Validates: Requirements 14.5**

Оптимистичные обновления улучшают UX, мгновенно обновляя UI до получения ответа от сервера. При ошибке изменения автоматически откатываются.

### Базовый пример оптимистичного обновления

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useOptimisticWorkspaceUpdate() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    orpc.workspace.update.mutationOptions({
      // 1. onMutate - выполняется перед отправкой запроса
      onMutate: async (variables) => {
        // Отменяем текущие запросы для этого workspace
        // Это предотвращает race conditions
        await queryClient.cancelQueries({
          queryKey: orpc.workspace.get.queryKey({ id: variables.id }),
        });
        
        // Сохраняем предыдущее состояние для возможного отката
        const previousWorkspace = queryClient.getQueryData(
          orpc.workspace.get.queryKey({ id: variables.id })
        );
        
        // Оптимистично обновляем кэш
        // UI обновится мгновенно
        queryClient.setQueryData(
          orpc.workspace.get.queryKey({ id: variables.id }),
          (old: any) => ({
            ...old,
            ...variables,
          })
        );
        
        // Возвращаем контекст для использования в onError
        return { previousWorkspace };
      },
      
      // 2. onError - выполняется при ошибке
      onError: (error, variables, context) => {
        // Откатываем изменения к предыдущему состоянию
        if (context?.previousWorkspace) {
          queryClient.setQueryData(
            orpc.workspace.get.queryKey({ id: variables.id }),
            context.previousWorkspace
          );
        }
        
        toast.error("Не удалось обновить рабочую область");
      },
      
      // 3. onSettled - выполняется всегда (успех или ошибка)
      onSettled: (data, error, variables) => {
        // Синхронизируем данные с сервером
        // Это гарантирует актуальность данных
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.get.queryKey({ id: variables.id }),
        });
      },
      
      onSuccess: () => {
        toast.success("Рабочая область обновлена");
      },
    })
  );
}
```

### Использование оптимистичного хука

```typescript
"use client";

import { useOptimisticWorkspaceUpdate } from "~/hooks/use-optimistic-workspace";

export function WorkspaceSettings({ workspaceId }: { workspaceId: string }) {
  const { mutate, isPending } = useOptimisticWorkspaceUpdate();
  
  const handleUpdate = (name: string) => {
    mutate({
      id: workspaceId,
      name,
    });
  };
  
  return (
    <div>
      <input
        onChange={(e) => handleUpdate(e.target.value)}
        disabled={isPending}
        placeholder="Название рабочей области"
      />
    </div>
  );
}
```

### Оптимистичное добавление в список

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useOptimisticWorkspaceCreate() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    orpc.workspace.create.mutationOptions({
      onMutate: async (newWorkspace) => {
        // Отменяем текущие запросы списка
        await queryClient.cancelQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });
        
        // Сохраняем предыдущий список
        const previousWorkspaces = queryClient.getQueryData(
          orpc.workspace.list.queryKey()
        );
        
        // Оптимистично добавляем новый workspace в список
        queryClient.setQueryData(
          orpc.workspace.list.queryKey(),
          (old: any[] = []) => [
            ...old,
            {
              // Временный ID до получения реального от сервера
              id: `temp-${Date.now()}`,
              ...newWorkspace,
              createdAt: new Date(),
            },
          ]
        );
        
        return { previousWorkspaces };
      },
      
      onError: (error, variables, context) => {
        // Откат к предыдущему списку
        if (context?.previousWorkspaces) {
          queryClient.setQueryData(
            orpc.workspace.list.queryKey(),
            context.previousWorkspaces
          );
        }
        
        toast.error("Не удалось создать рабочую область");
      },
      
      onSuccess: (data) => {
        toast.success("Рабочая область создана");
      },
      
      onSettled: () => {
        // Синхронизация с сервером
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });
      },
    })
  );
}
```

### Оптимистичное удаление из списка

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useOptimisticWorkspaceDelete() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    orpc.workspace.delete.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });
        
        const previousWorkspaces = queryClient.getQueryData(
          orpc.workspace.list.queryKey()
        );
        
        // Оптимистично удаляем workspace из списка
        queryClient.setQueryData(
          orpc.workspace.list.queryKey(),
          (old: any[] = []) => old.filter((w) => w.id !== variables.id)
        );
        
        return { previousWorkspaces };
      },
      
      onError: (error, variables, context) => {
        if (context?.previousWorkspaces) {
          queryClient.setQueryData(
            orpc.workspace.list.queryKey(),
            context.previousWorkspaces
          );
        }
        
        toast.error("Не удалось удалить рабочую область");
      },
      
      onSuccess: () => {
        toast.success("Рабочая область удалена");
      },
      
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });
      },
    })
  );
}
```

### Оптимистичное обновление вложенных данных

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useOptimisticMemberAdd() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    orpc.workspace.members.add.mutationOptions({
      onMutate: async (variables) => {
        const queryKey = orpc.workspace.members.list.queryKey({
          workspaceId: variables.workspaceId,
        });
        
        await queryClient.cancelQueries({ queryKey });
        
        const previousMembers = queryClient.getQueryData(queryKey);
        
        // Оптимистично добавляем нового участника
        queryClient.setQueryData(queryKey, (old: any[] = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`,
            userId: variables.userId,
            role: variables.role,
            addedAt: new Date(),
          },
        ]);
        
        return { previousMembers, queryKey };
      },
      
      onError: (error, variables, context) => {
        if (context?.previousMembers && context?.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previousMembers);
        }
        
        toast.error("Не удалось добавить участника");
      },
      
      onSuccess: () => {
        toast.success("Участник добавлен");
      },
      
      onSettled: (data, error, variables, context) => {
        if (context?.queryKey) {
          queryClient.invalidateQueries({ queryKey: context.queryKey });
        }
      },
    })
  );
}
```

### Оптимистичное обновление с множественными запросами

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useOptimisticWorkspaceArchive() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    orpc.workspace.archive.mutationOptions({
      onMutate: async (variables) => {
        // Отменяем все связанные запросы
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: orpc.workspace.list.queryKey(),
          }),
          queryClient.cancelQueries({
            queryKey: orpc.workspace.get.queryKey({ id: variables.id }),
          }),
        ]);
        
        // Сохраняем предыдущие состояния
        const previousList = queryClient.getQueryData(
          orpc.workspace.list.queryKey()
        );
        const previousWorkspace = queryClient.getQueryData(
          orpc.workspace.get.queryKey({ id: variables.id })
        );
        
        // Обновляем список - удаляем архивированный workspace
        queryClient.setQueryData(
          orpc.workspace.list.queryKey(),
          (old: any[] = []) => old.filter((w) => w.id !== variables.id)
        );
        
        // Обновляем отдельный workspace - помечаем как архивированный
        queryClient.setQueryData(
          orpc.workspace.get.queryKey({ id: variables.id }),
          (old: any) => ({
            ...old,
            archived: true,
            archivedAt: new Date(),
          })
        );
        
        return { previousList, previousWorkspace };
      },
      
      onError: (error, variables, context) => {
        // Откатываем оба запроса
        if (context?.previousList) {
          queryClient.setQueryData(
            orpc.workspace.list.queryKey(),
            context.previousList
          );
        }
        
        if (context?.previousWorkspace) {
          queryClient.setQueryData(
            orpc.workspace.get.queryKey({ id: variables.id }),
            context.previousWorkspace
          );
        }
        
        toast.error("Не удалось архивировать рабочую область");
      },
      
      onSuccess: () => {
        toast.success("Рабочая область архивирована");
      },
      
      onSettled: (data, error, variables) => {
        // Синхронизируем все связанные запросы
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.get.queryKey({ id: variables.id }),
        });
      },
    })
  );
}
```

### Оптимистичное обновление с debounce

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

export function WorkspaceNameEditor({ workspaceId, initialName }: {
  workspaceId: string;
  initialName: string;
}) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  const { mutate } = useMutation(
    orpc.workspace.update.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: orpc.workspace.get.queryKey({ id: variables.id }),
        });
        
        const previous = queryClient.getQueryData(
          orpc.workspace.get.queryKey({ id: variables.id })
        );
        
        queryClient.setQueryData(
          orpc.workspace.get.queryKey({ id: variables.id }),
          (old: any) => ({ ...old, name: variables.name })
        );
        
        return { previous };
      },
      
      onError: (error, variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            orpc.workspace.get.queryKey({ id: variables.id }),
            context.previous
          );
        }
        toast.error("Не удалось обновить название");
      },
      
      onSettled: (data, error, variables) => {
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.get.queryKey({ id: variables.id }),
        });
      },
    })
  );
  
  // Debounce для уменьшения количества запросов
  const debouncedUpdate = useDebouncedCallback((name: string) => {
    mutate({ id: workspaceId, name });
  }, 500);
  
  return (
    <input
      defaultValue={initialName}
      onChange={(e) => debouncedUpdate(e.target.value)}
      placeholder="Название рабочей области"
    />
  );
}
```

### Преимущества оптимистичных обновлений

1. **Мгновенный отклик**: UI обновляется сразу, без ожидания сервера
2. **Лучший UX**: Приложение кажется быстрее и отзывчивее
3. **Автоматический откат**: При ошибке изменения откатываются автоматически
4. **Синхронизация**: После завершения данные синхронизируются с сервером
5. **Предотвращение race conditions**: Отмена текущих запросов предотвращает конфликты

### Когда использовать оптимистичные обновления

**Используйте для:**
- Простых операций обновления (изменение имени, описания)
- Операций с высокой вероятностью успеха
- Действий, где важна скорость отклика (редактирование текста)
- Операций, которые можно легко откатить

**Не используйте для:**
- Критичных операций (платежи, удаление аккаунта)
- Операций с низкой вероятностью успеха
- Сложных операций с множественными зависимостями
- Операций, где важна точность данных

---

## Работа с Query Client

### Инвалидация запросов

```typescript
import { useORPC } from "~/orpc/react";
import { useQueryClient } from "@tanstack/react-query";

export function useWorkspaceActions() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  const invalidateWorkspace = (id: string) => {
    // Инвалидация конкретного workspace
    queryClient.invalidateQueries({
      queryKey: orpc.workspace.get.queryKey({ id }),
    });
  };
  
  const invalidateAllWorkspaces = () => {
    // Инвалидация всех запросов workspace роутера
    queryClient.invalidateQueries({
      queryKey: orpc.workspace.list.queryKey(),
    });
  };
  
  const invalidateAllORPC = () => {
    // Инвалидация всех oRPC запросов
    queryClient.invalidateQueries();
  };
  
  return {
    invalidateWorkspace,
    invalidateAllWorkspaces,
    invalidateAllORPC,
  };
}
```

### Чтение и запись в кэш

```typescript
import { useORPC } from "~/orpc/react";
import { useQueryClient } from "@tanstack/react-query";

export function useWorkspaceCache() {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  
  const getWorkspaceFromCache = (id: string) => {
    return queryClient.getQueryData(
      orpc.workspace.get.queryKey({ id })
    );
  };
  
  const setWorkspaceInCache = (id: string, data: any) => {
    queryClient.setQueryData(
      orpc.workspace.get.queryKey({ id }),
      data
    );
  };
  
  return {
    getWorkspaceFromCache,
    setWorkspaceInCache,
  };
}
```

---

## Типобезопасность

### Экспорт типов

```typescript
// packages/api/src/root-orpc.ts
import { createRouter } from "./orpc";
import { workspaceRouter } from "./routers/workspace";

export const appRouter = createRouter({
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
```

### Использование типов на клиенте

```typescript
import type { AppRouter } from "@qbs-autonaim/api";
import type { inferRouterInputs, inferRouterOutputs } from "@orpc/server";

// Типы входных данных
type RouterInputs = inferRouterInputs<AppRouter>;
type WorkspaceCreateInput = RouterInputs["workspace"]["create"];

// Типы выходных данных
type RouterOutputs = inferRouterOutputs<AppRouter>;
type Workspace = RouterOutputs["workspace"]["get"];

// Использование
const createWorkspace = (input: WorkspaceCreateInput) => {
  // TypeScript проверит типы
};
```


---

## Сравнение с tRPC

### Основные изменения при миграции

| Аспект | tRPC | oRPC |
|--------|------|------|
| Импорт процедур | `import { protectedProcedure } from "../../trpc"` | `import { protectedProcedure } from "../../orpc"` |
| Ошибки | `TRPCError` | `ORPCError` |
| Тип роутера | `TRPCRouterRecord` | `ORPCRouterRecord` |
| Клиентский хук | `useTRPC()` | `useORPC()` |
| Провайдер | `TRPCReactProvider` | `ORPCReactProvider` |
| API endpoint | `/api/trpc` | `/api/orpc` |

### Что остается без изменений

- Синтаксис определения процедур (`.query()`, `.mutation()`, `.input()`)
- Валидация через Zod
- Интеграция с TanStack Query
- Структура роутеров и вложенность
- Middleware система
- Типобезопасность

---

## Лучшие практики

### 1. Всегда валидируйте входные данные

```typescript
// ✅ Правильно
export const get = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    // input типизирован и провалидирован
  });

// ❌ Неправильно
export const get = protectedProcedure
  .query(async ({ ctx }) => {
    // Нет валидации входных данных
  });
```

### 2. Проверяйте права доступа

```typescript
// ✅ Правильно - сначала существование, потом доступ
const workspace = await ctx.workspaceRepository.findById(input.id);

if (!workspace) {
  throw new ORPCError({
    code: "NOT_FOUND",
    message: "Рабочая область не найдена",
  });
}

const hasAccess = await ctx.workspaceRepository.checkAccess(
  input.id,
  ctx.session.user.id
);

if (!hasAccess) {
  throw new ORPCError({
    code: "FORBIDDEN",
    message: "Нет доступа к рабочей области",
  });
}
```

### 3. Используйте правильные коды ошибок

```typescript
// NOT_FOUND - ресурс не найден
// FORBIDDEN - нет прав доступа
// BAD_REQUEST - некорректные данные
// UNAUTHORIZED - не авторизован
// CONFLICT - конфликт данных (например, дубликат)
// TOO_MANY_REQUESTS - превышен rate limit
// INTERNAL_SERVER_ERROR - внутренняя ошибка
```

### 4. Сообщения об ошибках на русском языке

```typescript
// ✅ Правильно
throw new ORPCError({
  code: "NOT_FOUND",
  message: "Рабочая область не найдена",
});

// ❌ Неправильно
throw new ORPCError({
  code: "NOT_FOUND",
  message: "Workspace not found",
});
```

### 5. Используйте оптимистичные обновления для лучшего UX

```typescript
// Оптимистичное обновление делает UI отзывчивым
const { mutate } = useMutation(
  orpc.workspace.update.mutationOptions({
    onMutate: async (variables) => {
      // Мгновенное обновление UI
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, newData);
      return { previous };
    },
    onError: (err, variables, context) => {
      // Откат при ошибке
      queryClient.setQueryData(queryKey, context.previous);
    },
  })
);
```

### 6. Используйте server-side prefetch для критичных данных

```typescript
// Server Component - данные загружаются на сервере
export default async function Page() {
  await orpcServer().workspace.list.prefetch();
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceList /> {/* Мгновенное отображение */}
    </HydrationBoundary>
  );
}
```

---

## Частые ошибки и решения

### Ошибка: "Cannot read property 'user' of null"

**Проблема:** Использование `ctx.session.user` в `publicProcedure`

**Решение:** Используйте `protectedProcedure` или проверяйте наличие сессии

```typescript
// ✅ Правильно
export const get = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session.user.id; // Гарантированно существует
  });

// Или
export const get = publicProcedure
  .query(async ({ ctx }) => {
    if (ctx.session?.user) {
      // Пользователь авторизован
    }
  });
```

### Ошибка: Zod валидация не работает

**Проблема:** Забыли добавить `.input()`

**Решение:** Всегда добавляйте валидацию

```typescript
// ✅ Правильно
export const get = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => {
    // input провалидирован
  });
```

### Ошибка: TypeScript ошибки на клиенте

**Проблема:** Не экспортирован тип `AppRouter`

**Решение:** Убедитесь что тип экспортирован

```typescript
// packages/api/src/root-orpc.ts
export const appRouter = createRouter({ ... });
export type AppRouter = typeof appRouter;
```

---

## Дополнительные ресурсы

- [Документация oRPC](https://orpc.dev)
- [Документация TanStack Query](https://tanstack.com/query)
- [Документация Zod](https://zod.dev)
- [ROUTER_STRUCTURE.md](./ROUTER_STRUCTURE.md) - структура роутеров проекта

---

## Заключение

oRPC предоставляет мощный и типобезопасный способ построения API с минимальными изменениями по сравнению с tRPC. Следуйте примерам из этого документа для создания надежных и поддерживаемых API endpoints.

**Ключевые принципы:**
- Всегда валидируйте входные данные через Zod
- Проверяйте права доступа перед операциями
- Используйте понятные сообщения об ошибках на русском языке
- Применяйте оптимистичные обновления для лучшего UX
- Используйте server-side prefetch для критичных данных
