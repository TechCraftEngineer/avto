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

### Query на клиенте

```typescript
"use client";

import { useORPC } from "~/orpc/react";
import { useQuery } from "@tanstack/react-query";

export function WorkspaceList() {
  const orpc = useORPC();
  
  const { data, isPending, error } = useQuery(
    orpc.workspace.list.queryOptions()
  );
  
  if (isPending) {
    return <div>Загрузка...</div>;
  }
  
  if (error) {
    return <div>Ошибка: {error.message}</div>;
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


### Mutation на клиенте

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
        
        // Инвалидация списка workspace
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

### Условные запросы с skipToken

```typescript
import { useORPC } from "~/orpc/react";
import { useQuery, skipToken } from "@tanstack/react-query";

export function WorkspaceDetails({ workspaceId }: { workspaceId?: string }) {
  const orpc = useORPC();
  
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


---

## Server-side prefetch

Server-side prefetch позволяет загружать данные на сервере и передавать их клиенту для мгновенного отображения.

### Настройка серверных хелперов

```typescript
// apps/app/src/orpc/server.ts
import "server-only";

import { cache } from "react";
import { createORPCClient, httpBatchStreamLink } from "@orpc/client";
import { createQueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@qbs-autonaim/api";
import SuperJSON from "superjson";
import { auth } from "~/auth/server";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getQueryClient = cache(() => createQueryClient());

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
          if (session?.user) {
            headers.set("authorization", `Bearer ${session.user.id}`);
          }
          return headers;
        },
      }),
    ],
  });
});

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
  };
};
```

### Использование в Server Component

```typescript
// apps/app/src/app/workspaces/page.tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, orpcServer } from "~/orpc/server";
import { WorkspaceList } from "./workspace-list";

export default async function WorkspacesPage() {
  const queryClient = getQueryClient();
  const server = orpcServer();
  
  // Prefetch данных на сервере
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
  const { data } = useQuery(orpc.workspace.list.queryOptions());
  
  return (
    <ul>
      {data?.map((workspace) => (
        <li key={workspace.id}>{workspace.name}</li>
      ))}
    </ul>
  );
}
```

---

## Оптимистичные обновления

Оптимистичные обновления улучшают UX, мгновенно обновляя UI до получения ответа от сервера.

### Пример: Оптимистичное обновление workspace

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
      // 1. Перед mutation - оптимистичное обновление
      onMutate: async (variables) => {
        // Отменяем текущие запросы для этого workspace
        await queryClient.cancelQueries({
          queryKey: orpc.workspace.get.queryKey({ id: variables.id }),
        });
        
        // Сохраняем предыдущее состояние для отката
        const previousWorkspace = queryClient.getQueryData(
          orpc.workspace.get.queryKey({ id: variables.id })
        );
        
        // Оптимистично обновляем кэш
        queryClient.setQueryData(
          orpc.workspace.get.queryKey({ id: variables.id }),
          (old: any) => ({
            ...old,
            ...variables,
          })
        );
        
        return { previousWorkspace };
      },
      
      // 2. При ошибке - откат к предыдущему состоянию
      onError: (error, variables, context) => {
        if (context?.previousWorkspace) {
          queryClient.setQueryData(
            orpc.workspace.get.queryKey({ id: variables.id }),
            context.previousWorkspace
          );
        }
        
        toast.error("Не удалось обновить рабочую область");
      },
      
      // 3. После завершения - синхронизация с сервером
      onSettled: (data, error, variables) => {
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

