# Документ дизайна: Миграция с tRPC на oRPC

## Обзор

Данный документ описывает технический дизайн миграции API проекта с tRPC на oRPC. oRPC (Open RPC) - это современный RPC фреймворк, совместимый с tRPC, но предоставляющий улучшенную производительность, лучшую интеграцию с OpenAPI и более гибкую архитектуру.

### Ключевые преимущества oRPC

1. **Совместимость с tRPC**: Похожий API упрощает миграцию
2. **OpenAPI поддержка**: Автоматическая генерация OpenAPI спецификаций
3. **Улучшенная производительность**: Оптимизированная сериализация и батчинг
4. **Лучшая типизация**: Улучшенный type inference
5. **Гибкие middleware**: Более мощная система middleware

### Стратегия миграции

Миграция будет выполняться поэтапно:
1. Настройка oRPC инфраструктуры параллельно с tRPC
2. Миграция серверной конфигурации и middleware
3. Миграция роутеров по одному с сохранением API путей
4. Миграция клиентской части
5. Удаление tRPC зависимостей после полной миграции

## Архитектура

### Текущая архитектура (tRPC)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              TRPCReactProvider                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         TanStack Query Client                    │ │ │
│  │  │  ┌────────────────────────────────────────────┐ │ │ │
│  │  │  │      tRPC Client (httpBatchStreamLink)    │ │ │ │ │
│  │  │  └────────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP (POST /api/trpc)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Package (@qbs-autonaim/api)          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  tRPC Server                           │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Context (auth, db, repositories, middleware)    │ │ │
│  │  ├──────────────────────────────────────────────────┤ │ │
│  │  │  Middleware Stack:                               │ │ │
│  │  │  - timingMiddleware                              │ │ │
│  │  │  - securityHeadersMiddleware                     │ │ │
│  │  │  - securityAudit                                 │ │ │
│  │  ├──────────────────────────────────────────────────┤ │ │
│  │  │  Procedures:                                     │ │ │
│  │  │  - publicProcedure                               │ │ │
│  │  │  - protectedProcedure                            │ │ │
│  │  ├──────────────────────────────────────────────────┤ │ │
│  │  │  27 Routers (workspace, vacancy, user, etc.)    │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Целевая архитектура (oRPC)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ORPCReactProvider                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         TanStack Query Client                    │ │ │
│  │  │  ┌────────────────────────────────────────────┐ │ │ │
│  │  │  │      oRPC Client (httpBatchStreamLink)    │ │ │ │ │
│  │  │  └────────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP (POST /api/orpc)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Package (@qbs-autonaim/api)          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  oRPC Server                           │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Context (auth, db, repositories, middleware)    │ │ │
│  │  ├──────────────────────────────────────────────────┤ │ │
│  │  │  Middleware Stack:                               │ │ │
│  │  │  - timingMiddleware                              │ │ │
│  │  │  - securityHeadersMiddleware                     │ │ │
│  │  │  - securityAudit                                 │ │ │
│  │  ├──────────────────────────────────────────────────┤ │ │
│  │  │  Procedures:                                     │ │ │
│  │  │  - publicProcedure                               │ │ │
│  │  │  - protectedProcedure                            │ │ │
│  │  ├──────────────────────────────────────────────────┤ │ │
│  │  │  27 Routers (workspace, vacancy, user, etc.)    │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Компоненты и интерфейсы

### 1. Серверная конфигурация (packages/api/src/orpc.ts)

#### Создание контекста

```typescript
import { createORPCContext } from '@orpc/server';
import type { Auth } from '@qbs-autonaim/auth';
import { OrganizationRepository, WorkspaceRepository } from '@qbs-autonaim/db';
import { db } from '@qbs-autonaim/db/client';
import { inngest } from '@qbs-autonaim/jobs/client';
import SuperJSON from 'superjson';
import { z, ZodError } from 'zod';
import { AuditLoggerService } from './services/audit-logger';
import { extractTokenFromHeaders } from './utils/interview-token-validator';

/**
 * Создание контекста для oRPC
 * Идентично tRPC контексту для обеспечения совместимости
 */
export const createContext = async (opts: {
  headers: Headers;
  auth: Auth | null;
}) => {
  const authApi = opts.auth?.api;
  const session = authApi
    ? await authApi.getSession({
        headers: opts.headers,
      })
    : null;

  const workspaceRepository = new WorkspaceRepository(db);
  const organizationRepository = new OrganizationRepository(db);
  const auditLogger = new AuditLoggerService(db);

  const ipAddress =
    opts.headers.get('x-forwarded-for') ??
    opts.headers.get('x-real-ip') ??
    undefined;
  const userAgent = opts.headers.get('user-agent') ?? undefined;
  const interviewToken = extractTokenFromHeaders(opts.headers);

  return {
    authApi,
    session,
    db,
    workspaceRepository,
    organizationRepository,
    auditLogger,
    ipAddress,
    userAgent,
    interviewToken,
    inngest,
    headers: opts.headers,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

#### Инициализация oRPC

```typescript
import { initORPC } from '@orpc/server';

/**
 * Инициализация oRPC с конфигурацией
 */
const orpc = initORPC.context<Context>().create({
  // Трансформер для сериализации Date, Map, Set и других типов
  transformer: SuperJSON,
  
  // Форматирование ошибок (аналогично tRPC)
  errorFormatter: ({ error }) => {
    return {
      message: error.message,
      code: error.code,
      data: {
        zodError:
          error.cause instanceof ZodError
            ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
            : null,
      },
    };
  },
});

export const createRouter = orpc.router;
export const middleware = orpc.middleware;
export const procedure = orpc.procedure;
```

### 2. Middleware

#### Timing Middleware

```typescript
/**
 * Middleware для логирования времени выполнения
 */
const timingMiddleware = middleware(async ({ next, path }) => {
  const start = Date.now();
  const result = await next();
  const end = Date.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ORPC] ${path} выполнен за ${end - start}мс`);
  }
  
  return result;
});
```

#### Security Audit Middleware

```typescript
import { ORPCError } from '@orpc/server';

/**
 * Middleware для аудита безопасности
 */
const securityAudit = middleware(async ({ ctx, type, path, next }) => {
  const startTime = Date.now();
  const userId = ctx.session?.user?.id;
  const ipAddress = ctx.ipAddress;

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[Security Audit] ${type.toUpperCase()} ${path} | IP: ${ipAddress || 'unknown'} | User: ${userId || 'anonymous'}`,
    );
  }

  try {
    const result = await next();

    // Логирование успешных mutations для аудита
    if (userId && type === 'mutation') {
      logSecurityEvent.suspiciousActivity(
        {
          type: 'data_modification',
          operation: 'MODIFY',
          userId,
        },
        ipAddress,
        userId,
      );
    }

    return result;
  } catch (error) {
    // Логирование нарушений безопасности
    if (error instanceof ORPCError) {
      if (error.code === 'UNAUTHORIZED') {
        console.warn(
          `[Security] UNAUTHORIZED access attempt | IP: ${ipAddress || 'unknown'} | Path: ${path}`,
        );
        logSecurityEvent.accessDenied(
          userId || 'anonymous',
          'unknown',
          ipAddress,
        );
      } else if (error.code === 'TOO_MANY_REQUESTS') {
        logSecurityEvent.rateLimitExceeded(ipAddress, userId, 'unknown');
      } else if (error.code === 'FORBIDDEN') {
        console.warn(
          `[Security] FORBIDDEN access | IP: ${ipAddress || 'unknown'} | User: ${userId || 'anonymous'} | Path: ${path}`,
        );
        logSecurityEvent.suspiciousActivity(
          {
            error: error.message,
            code: error.code,
          },
          ipAddress,
          userId,
        );
      }
    }

    throw error;
  } finally {
    const executionTime = Date.now() - startTime;
    if (executionTime > 5000) {
      console.warn(
        `[Performance] Slow operation detected: ${path} took ${executionTime}ms | IP: ${ipAddress || 'unknown'}`,
      );
      logSecurityEvent.suspiciousActivity(
        {
          type: 'slow_operation',
          executionTime,
        },
        ipAddress,
        userId,
      );
    }
  }
});
```

#### Security Headers Middleware

```typescript
/**
 * Middleware для security headers
 * Примечание: В oRPC headers добавляются в route handler
 */
const securityHeadersMiddleware = middleware(async ({ next }) => {
  const result = await next();
  // Headers устанавливаются в Next.js route handler
  return result;
});
```

### 3. Процедуры (Procedures)

#### Public Procedure

```typescript
/**
 * Публичная процедура (без требования авторизации)
 */
export const publicProcedure = procedure
  .use(timingMiddleware)
  .use(securityHeadersMiddleware)
  .use(securityAudit);
```

#### Protected Procedure

```typescript
import { ORPCError } from '@orpc/server';

/**
 * Защищенная процедура (требует авторизации)
 */
export const protectedProcedure = procedure
  .use(timingMiddleware)
  .use(securityHeadersMiddleware)
  .use(securityAudit)
  .use(
    middleware(({ ctx, next }) => {
      if (!ctx.session?.user) {
        throw new ORPCError({
          code: 'UNAUTHORIZED',
          message: 'Требуется авторизация',
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

### 4. Миграция роутеров

#### Пример: Workspace Router

**До (tRPC):**
```typescript
// packages/api/src/routers/workspace/list.ts
import { protectedProcedure } from '../../trpc';

export const list = protectedProcedure.query(async ({ ctx }) => {
  const workspaces = await ctx.workspaceRepository.findByUserId(
    ctx.session.user.id,
  );
  return workspaces;
});
```

**После (oRPC):**
```typescript
// packages/api/src/routers/workspace/list.ts
import { protectedProcedure } from '../../orpc';

export const list = protectedProcedure.query(async ({ ctx }) => {
  const workspaces = await ctx.workspaceRepository.findByUserId(
    ctx.session.user.id,
  );
  return workspaces;
});
```

**Изменения:**
- Импорт из `../../orpc` вместо `../../trpc`
- Логика процедуры остается идентичной

#### Пример: Процедура с валидацией

**До (tRPC):**
```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../trpc';
import { workspaceIdSchema } from '@qbs-autonaim/validators';
import { TRPCError } from '@trpc/server';

export const get = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    const workspace = await ctx.workspaceRepository.findById(input.id);
    
    if (!workspace) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Workspace не найден',
      });
    }
    
    return workspace;
  });
```

**После (oRPC):**
```typescript
import { z } from 'zod';
import { protectedProcedure } from '../../orpc';
import { workspaceIdSchema } from '@qbs-autonaim/validators';
import { ORPCError } from '@orpc/server';

export const get = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    const workspace = await ctx.workspaceRepository.findById(input.id);
    
    if (!workspace) {
      throw new ORPCError({
        code: 'NOT_FOUND',
        message: 'Workspace не найден',
      });
    }
    
    return workspace;
  });
```

**Изменения:**
- Импорт `ORPCError` вместо `TRPCError`
- Импорт из `../../orpc` вместо `../../trpc`

#### Пример: Вложенный роутер

**До (tRPC):**
```typescript
// packages/api/src/routers/workspace/index.ts
import type { TRPCRouterRecord } from '@trpc/server';
import { create } from './create';
import { get } from './get';
import { membersRouter } from './members';

export const workspaceRouter = {
  get,
  create,
  members: membersRouter,
} satisfies TRPCRouterRecord;
```

**После (oRPC):**
```typescript
// packages/api/src/routers/workspace/index.ts
import type { ORPCRouterRecord } from '@orpc/server';
import { create } from './create';
import { get } from './get';
import { membersRouter } from './members';

export const workspaceRouter = {
  get,
  create,
  members: membersRouter,
} satisfies ORPCRouterRecord;
```

**Изменения:**
- Импорт `ORPCRouterRecord` вместо `TRPCRouterRecord`

### 5. Главный роутер

**До (tRPC):**
```typescript
// packages/api/src/root.ts
import { createTRPCRouter } from './trpc';
import { workspaceRouter } from './routers/workspace';
// ... другие роутеры

export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  // ... другие роутеры
});

export type AppRouter = typeof appRouter;
```

**После (oRPC):**
```typescript
// packages/api/src/root.ts
import { createRouter } from './orpc';
import { workspaceRouter } from './routers/workspace';
// ... другие роутеры

export const appRouter = createRouter({
  workspace: workspaceRouter,
  // ... другие роутеры
});

export type AppRouter = typeof appRouter;
```

**Изменения:**
- Использование `createRouter` из `./orpc`

### 6. Next.js Route Handler

**До (tRPC):**
```typescript
// apps/app/src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@qbs-autonaim/api';
import { createTRPCContext } from '@qbs-autonaim/api/trpc';
import { auth } from '~/auth/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers, auth }),
  });

export { handler as GET, handler as POST };
```

**После (oRPC):**
```typescript
// apps/app/src/app/api/orpc/[...orpc]/route.ts
import { fetchRequestHandler } from '@orpc/server/adapters/fetch';
import { appRouter } from '@qbs-autonaim/api';
import { createContext } from '@qbs-autonaim/api/orpc';
import { auth } from '~/auth/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/orpc',
    req,
    router: appRouter,
    createContext: () => createContext({ headers: req.headers, auth }),
  });

export { handler as GET, handler as POST };
```

**Изменения:**
- Путь изменен на `/api/orpc/[...orpc]`
- Импорт из `@orpc/server/adapters/fetch`
- Использование `createContext` из `@qbs-autonaim/api/orpc`

### 7. Клиентская конфигурация

**До (tRPC):**
```typescript
// apps/app/src/trpc/react.tsx
'use client';

import type { AppRouter } from '@qbs-autonaim/api';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import SuperJSON from 'superjson';

export const { useTRPC, useTRPCClient, TRPCProvider } =
  createTRPCContext<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            const headers = new Headers();
            headers.set('x-trpc-source', 'nextjs-react');
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

**После (oRPC):**
```typescript
// apps/app/src/orpc/react.tsx
'use client';

import type { AppRouter } from '@qbs-autonaim/api';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createORPCClient,
  httpBatchStreamLink,
  loggerLink,
} from '@orpc/client';
import { createORPCContext } from '@orpc/tanstack-react-query';
import { useState } from 'react';
import SuperJSON from 'superjson';

export const { useORPC, useORPCClient, ORPCProvider } =
  createORPCContext<AppRouter>();

export function ORPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [orpcClient] = useState(() =>
    createORPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: `${getBaseUrl()}/api/orpc`,
          headers() {
            const headers = new Headers();
            headers.set('x-orpc-source', 'nextjs-react');
            return headers;
          },
        }),
      ],
    }),
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

**Изменения:**
- Импорты из `@orpc/client` и `@orpc/tanstack-react-query`
- Использование `createORPCClient` и `createORPCContext`
- URL изменен на `/api/orpc`
- Header изменен на `x-orpc-source`

### 8. Использование на клиенте

**До (tRPC):**
```typescript
import { useTRPC } from '~/trpc/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const trpc = useTRPC();
const queryClient = useQueryClient();

// Query
const { data, isPending } = useQuery(
  trpc.workspace.list.queryOptions()
);

// Mutation
const { mutate } = useMutation(
  trpc.workspace.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.list.queryKey(),
      });
    },
  })
);
```

**После (oRPC):**
```typescript
import { useORPC } from '~/orpc/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const orpc = useORPC();
const queryClient = useQueryClient();

// Query
const { data, isPending } = useQuery(
  orpc.workspace.list.queryOptions()
);

// Mutation
const { mutate } = useMutation(
  orpc.workspace.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.workspace.list.queryKey(),
      });
    },
  })
);
```

**Изменения:**
- Использование `useORPC` вместо `useTRPC`
- Переменная `orpc` вместо `trpc`

## Модели данных

### Типы ошибок

```typescript
// oRPC Error Codes (совместимы с tRPC)
type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_SUPPORTED'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNPROCESSABLE_CONTENT'
  | 'TOO_MANY_REQUESTS'
  | 'CLIENT_CLOSED_REQUEST'
  | 'INTERNAL_SERVER_ERROR';

interface ORPCError {
  code: ErrorCode;
  message: string;
  cause?: unknown;
}
```

### Контекст

```typescript
interface Context {
  authApi: Auth['api'] | null;
  session: Session | null;
  db: Database;
  workspaceRepository: WorkspaceRepository;
  organizationRepository: OrganizationRepository;
  auditLogger: AuditLoggerService;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  interviewToken: string | null;
  inngest: Inngest;
  headers: Headers;
}
```

### Router Types

```typescript
// Экспорт типов для клиента
export type AppRouter = typeof appRouter;

// Типы входных данных
type RouterInputs = inferRouterInputs<AppRouter>;

// Типы выходных данных
type RouterOutputs = inferRouterOutputs<AppRouter>;
```



## Свойства корректности

*Свойство - это характеристика или поведение, которое должно выполняться для всех валидных выполнений системы - по сути, формальное утверждение о том, что система должна делать. Свойства служат мостом между человекочитаемыми спецификациями и машинно-проверяемыми гарантиями корректности.*

### Property 1: Контекст содержит все необходимые зависимости

*For any* валидных headers и auth объекта, создание контекста через createContext должно возвращать объект со всеми обязательными полями (authApi, session, db, workspaceRepository, organizationRepository, auditLogger, ipAddress, userAgent, interviewToken, inngest, headers)

**Validates: Requirements 1.1**

### Property 2: Zod ошибки форматируются с flattenError

*For any* процедуры с Zod валидацией и невалидных входных данных, ошибка должна содержать поле zodError с результатом flattenError

**Validates: Requirements 1.3**

### Property 3: Время выполнения логируется

*For any* процедуры, после её выполнения в логах должна быть запись с временем выполнения в миллисекундах

**Validates: Requirements 2.1**

### Property 4: UNAUTHORIZED ошибки логируются

*For any* защищенной процедуры, вызванной без авторизации, в логах должна быть запись о попытке несанкционированного доступа

**Validates: Requirements 2.3, 3.3, 6.5**

### Property 5: FORBIDDEN ошибки логируются

*For any* процедуры, выбрасывающей FORBIDDEN ошибку, в логах должна быть запись о подозрительной активности

**Validates: Requirements 2.4**

### Property 6: TOO_MANY_REQUESTS ошибки логируются

*For any* процедуры, выбрасывающей TOO_MANY_REQUESTS ошибку, в логах должна быть запись о превышении rate limit

**Validates: Requirements 2.5**

### Property 7: Mutations логируются для аудита

*For any* mutation процедуры, выполненной авторизованным пользователем, в логах должна быть запись о модификации данных с userId

**Validates: Requirements 2.6**

### Property 8: Middleware применяются в правильном порядке

*For any* процедуры, middleware должны выполняться в порядке: timingMiddleware → securityHeadersMiddleware → securityAudit

**Validates: Requirements 2.7**

### Property 9: protectedProcedure требует авторизации

*For any* защищенной процедуры без сессии, вызов должен выбрасывать ORPCError с кодом UNAUTHORIZED

**Validates: Requirements 3.3, 6.5**

### Property 10: protectedProcedure гарантирует наличие user

*For any* защищенной процедуры с валидной сессией, ctx.session.user должен быть определен и не null

**Validates: Requirements 3.4**

### Property 11: Middleware применяются к обоим типам процедур

*For any* publicProcedure и protectedProcedure, все middleware (timing, securityHeaders, securityAudit) должны применяться

**Validates: Requirements 3.5**

### Property 12: Zod валидация работает

*For any* процедуры с Zod схемой и невалидных входных данных, должна выбрасываться ошибка с кодом BAD_REQUEST

**Validates: Requirements 5.1**

### Property 13: Сообщения об ошибках на русском языке

*For any* ошибки, выброшенной с
русским языком, message должен быть на русском языке без англицизмов

**Validates: Requirements 5.2, 6.7**

### Property 13: Вложенные роутеры поддерживаются

*For any* роутера с вложенными роутерами (например, workspace.members), клиент должен иметь возможность вызывать процедуры через точечную нотацию

**Validates: Requirements 4.1**

### Property 14: Именованные экспорты роутеров

*For any* роутера, экспорт должен использовать именованный экспорт с типом ORPCRouterRecord

**Validates: Requirements 4.4**

### Property 15: Типобезопасность входных параметров

*For any* процедуры с Zod схемой, TypeScript должен выдавать ошибку компиляции при передаче невалидных типов

**Validates: Requirements 10.5**

### Property 16: Типобезопасность выходных данных

*For any* процедуры, возвращаемое значение должно иметь корректный TypeScript тип, выведенный из реализации

**Validates: Requirements 10.6**

### Property 17: Автокомплит имен процедур

*For any* клиентского вызова, IDE должна предоставлять автокомплит для всех доступных процедур

**Validates: Requirements 10.4**

### Property 18: Query keys генерируются корректно

*For any* процедуры, queryKey() должен возвращать уникальный массив, идентифицирующий запрос

**Validates: Requirements 8.1**

### Property 19: Инвалидация конкретного запроса

*For any* процедуры, invalidateQueries с queryKey должен инвалидировать только этот конкретный запрос

**Validates: Requirements 8.2**

### Property 20: Инвалидация всего роутера

*For any* роутера, invalidateQueries с pathFilter должен инвалидировать все запросы этого роутера

**Validates: Requirements 8.3**

### Property 21: Оптимистичное обновление с откатом

*For any* mutation с оптимистичным обновлением, при ошибке кэш должен откатиться к предыдущему состоянию

**Validates: Requirements 9.4**

### Property 22: Батчинг запросов

*For any* нескольких одновременных запросов, они должны группироваться в один HTTP запрос

**Validates: Requirements 15.1, 15.3**

### Property 23: SuperJSON сериализация

*For any* данных с Date, Map, Set или другими специальными типами, они должны корректно сериализоваться и десериализоваться

**Validates: Requirements 1.2**

### Property 24: Prefetch на сервере

*For any* серверного компонента, prefetchQuery должен загружать данные на сервере и передавать их клиенту через HydrationBoundary

**Validates: Requirements 7.5, 11.3**

### Property 25: Идентичность API путей

*For any* мигрированного роутера, пути API должны оставаться идентичными tRPC версии

**Validates: Requirements 12.2**

### Property 26: Идентичность сигнатур процедур

*For any* мигрированной процедуры, входные и выходные типы должны оставаться идентичными tRPC версии

**Validates: Requirements 12.3**

### Property 27: Совместимость тестов

*For any* существующего теста, он должен работать с oRPC без изменений логики

**Validates: Requirements 13.1, 13.4**

## Обработка ошибок

### Коды ошибок

oRPC использует стандартные HTTP-подобные коды ошибок, совместимые с tRPC:

```typescript
type ErrorCode =
  | 'BAD_REQUEST'           // 400 - Невалидные входные данные
  | 'UNAUTHORIZED'          // 401 - Требуется авторизация
  | 'FORBIDDEN'             // 403 - Доступ запрещен
  | 'NOT_FOUND'             // 404 - Ресурс не найден
  | 'METHOD_NOT_SUPPORTED'  // 405 - Метод не поддерживается
  | 'TIMEOUT'               // 408 - Таймаут запроса
  | 'CONFLICT'              // 409 - Конфликт данных
  | 'PRECONDITION_FAILED'   // 412 - Предусловие не выполнено
  | 'PAYLOAD_TOO_LARGE'     // 413 - Слишком большой payload
  | 'UNPROCESSABLE_CONTENT' // 422 - Невозможно обработать
  | 'TOO_MANY_REQUESTS'     // 429 - Превышен rate limit
  | 'CLIENT_CLOSED_REQUEST' // 499 - Клиент закрыл соединение
  | 'INTERNAL_SERVER_ERROR' // 500 - Внутренняя ошибка сервера
```

### Создание ошибок

```typescript
import { ORPCError } from '@orpc/server';

// Простая ошибка
throw new ORPCError({
  code: 'NOT_FOUND',
  message: 'Workspace не найден',
});

// Ошибка с дополнительными данными
throw new ORPCError({
  code: 'TOO_MANY_REQUESTS',
  message: 'Превышен лимит запросов',
  cause: {
    retryAfter: 60,
    limit: 100,
  },
});

// Ошибка с оригинальной причиной
try {
  await someOperation();
} catch (error) {
  throw new ORPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Не удалось выполнить операцию',
    cause: error,
  });
}
```

### Обработка ошибок на клиенте

```typescript
import { useORPC } from '~/orpc/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const orpc = useORPC();

const { mutate } = useMutation(
  orpc.workspace.create.mutationOptions({
    onError: (error) => {
      // error имеет тип ORPCError
      switch (error.code) {
        case 'UNAUTHORIZED':
          toast.error('Требуется авторизация');
          router.push('/login');
          break;
        case 'FORBIDDEN':
          toast.error('Доступ запрещен');
          break;
        case 'TOO_MANY_REQUESTS':
          toast.error('Слишком много запросов. Попробуйте позже');
          break;
        case 'BAD_REQUEST':
          // Zod ошибки валидации
          if (error.data?.zodError) {
            const fieldErrors = error.data.zodError.fieldErrors;
            Object.entries(fieldErrors).forEach(([field, errors]) => {
              toast.error(`${field}: ${errors?.join(', ')}`);
            });
          } else {
            toast.error(error.message);
          }
          break;
        default:
          toast.error('Произошла ошибка');
      }
    },
  })
);
```

### Форматирование Zod ошибок

```typescript
// В orpc.ts
const orpc = initORPC.context<Context>().create({
  errorFormatter: ({ error }) => {
    return {
      message: error.message,
      code: error.code,
      data: {
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});
```

Это обеспечивает структурированные ошибки валидации:

```typescript
{
  message: "Ошибка валидации",
  code: "BAD_REQUEST",
  data: {
    zodError: {
      formErrors: [],
      fieldErrors: {
        email: ["Невалидный email"],
        password: ["Минимум 8 символов"]
      }
    }
  }
}
```

### Логирование ошибок

Все ошибки автоматически логируются через securityAudit middleware:

- **UNAUTHORIZED**: Логируется как попытка несанкционированного доступа
- **FORBIDDEN**: Логируется как подозрительная активность
- **TOO_MANY_REQUESTS**: Логируется как превышение rate limit
- **Другие ошибки**: Логируются с полным контекстом (path, userId, ipAddress)

## Стратегия тестирования

### Двойной подход к тестированию

Проект использует комбинацию unit тестов и property-based тестов:

- **Unit тесты**: Проверяют конкретные примеры, граничные случаи и условия ошибок
- **Property тесты**: Проверяют универсальные свойства на множестве входных данных

Оба подхода дополняют друг друга и необходимы для полного покрытия.

### Property-Based Testing

Для property-based тестирования используется библиотека **fast-check**.

#### Конфигурация

Каждый property тест должен:
- Выполняться минимум 100 итераций
- Ссылаться на свойство из документа дизайна
- Использовать тег формата: **Feature: trpc-to-orpc-migration, Property {number}: {property_text}**

#### Пример property теста

```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createContext } from '../orpc';

describe('Property 1: Контекст содержит все необходимые зависимости', () => {
  /**
   * Feature: trpc-to-orpc-migration, Property 1
   * For any валидных headers и auth объекта, создание контекста через createContext
   * должно возвращать объект со всеми обязательными полями
   */
  it('должен создавать контекст со всеми обязательными полями', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          'x-forwarded-for': fc.option(fc.ipV4(), { nil: undefined }),
          'user-agent': fc.option(fc.string(), { nil: undefined }),
        }),
        async (headersObj) => {
          const headers = new Headers(headersObj);
          const auth = null; // Для простоты, можно расширить

          const ctx = await createContext({ headers, auth });

          // Проверяем наличие всех обязательных полей
          expect(ctx).toHaveProperty('authApi');
          expect(ctx).toHaveProperty('session');
          expect(ctx).toHaveProperty('db');
          expect(ctx).toHaveProperty('workspaceRepository');
          expect(ctx).toHaveProperty('organizationRepository');
          expect(ctx).toHaveProperty('auditLogger');
          expect(ctx).toHaveProperty('ipAddress');
          expect(ctx).toHaveProperty('userAgent');
          expect(ctx).toHaveProperty('interviewToken');
          expect(ctx).toHaveProperty('inngest');
          expect(ctx).toHaveProperty('headers');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Пример property теста для middleware

```typescript
describe('Property 8: Middleware применяются в правильном порядке', () => {
  /**
   * Feature: trpc-to-orpc-migration, Property 8
   * For any процедуры, middleware должны выполняться в порядке:
   * timingMiddleware → securityHeadersMiddleware → securityAudit
   */
  it('должен применять middleware в правильном порядке', async () => {
    const executionOrder: string[] = [];

    const testMiddleware = (name: string) =>
      middleware(async ({ next }) => {
        executionOrder.push(`${name}-before`);
        const result = await next();
        executionOrder.push(`${name}-after`);
        return result;
      });

    const testProcedure = procedure
      .use(testMiddleware('timing'))
      .use(testMiddleware('securityHeaders'))
      .use(testMiddleware('securityAudit'))
      .query(() => 'test');

    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        executionOrder.length = 0;
        await testProcedure({ ctx: mockContext });

        expect(executionOrder).toEqual([
          'timing-before',
          'securityHeaders-before',
          'securityAudit-before',
          'securityAudit-after',
          'securityHeaders-after',
          'timing-after',
        ]);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

Unit тесты фокусируются на:
- Конкретных примерах корректного поведения
- Граничных случаях
- Условиях ошибок
- Интеграции между компонентами

#### Пример unit теста

```typescript
import { describe, it, expect, vi } from 'vitest';
import { protectedProcedure } from '../orpc';
import { ORPCError } from '@orpc/server';

describe('protectedProcedure', () => {
  it('должен выбрасывать UNAUTHORIZED без сессии', async () => {
    const mockContext = {
      session: null,
      // ... другие поля
    };

    const testProcedure = protectedProcedure.query(() => 'test');

    await expect(
      testProcedure({ ctx: mockContext })
    ).rejects.toThrow(
      new ORPCError({
        code: 'UNAUTHORIZED',
        message: 'Требуется авторизация',
      })
    );
  });

  it('должен выполняться успешно с валидной сессией', async () => {
    const mockContext = {
      session: {
        user: { id: 'user-123', email: 'test@example.com' },
      },
      // ... другие поля
    };

    const testProcedure = protectedProcedure.query(({ ctx }) => {
      return ctx.session.user.id;
    });

    const result = await testProcedure({ ctx: mockContext });
    expect(result).toBe('user-123');
  });
});
```

### Integration Testing

Integration тесты проверяют взаимодействие между компонентами:

```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from '../root';
import { createContext } from '../orpc';

describe('Workspace Router Integration', () => {
  it('должен создать и получить workspace', async () => {
    const ctx = await createContext({
      headers: new Headers(),
      auth: mockAuth,
    });

    // Создаем workspace
    const created = await appRouter.workspace.create({
      ctx,
      input: { name: 'Test Workspace' },
    });

    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Test Workspace');

    // Получаем созданный workspace
    const fetched = await appRouter.workspace.get({
      ctx,
      input: { id: created.id },
    });

    expect(fetched).toEqual(created);
  });
});
```

### Тестирование миграции

Для валидации миграции:

1. **Сохранить все существующие тесты**: Все unit и integration тесты должны продолжать работать
2. **Добавить property тесты**: Для каждого свойства корректности из этого документа
3. **Тестировать параллельно**: Во время миграции запускать тесты для обеих версий (tRPC и oRPC)
4. **Сравнительное тестирование**: Убедиться, что oRPC версия возвращает идентичные результаты

#### Пример сравнительного теста

```typescript
describe('Migration Compatibility', () => {
  it('oRPC должен возвращать те же данные что и tRPC', async () => {
    const input = { id: 'workspace-123' };

    // tRPC версия
    const trpcResult = await trpcRouter.workspace.get({ ctx, input });

    // oRPC версия
    const orpcResult = await orpcRouter.workspace.get({ ctx, input });

    expect(orpcResult).toEqual(trpcResult);
  });
});
```

### Баланс unit тестов

- Избегайте написания слишком большого количества unit тестов
- Property-based тесты покрывают множество входных данных
- Unit тесты должны фокусироваться на:
  - Конкретных примерах, демонстрирующих корректное поведение
  - Точках интеграции между компонентами
  - Граничных случаях и условиях ошибок

### Запуск тестов

```bash
# Все тесты
bun test

# Только unit тесты
bun test:unit

# Только property тесты
bun test:property

# С покрытием
bun test:coverage

# Watch mode
bun test:watch
```

### Continuous Integration

Тесты должны запускаться в CI/CD pipeline:
- На каждый pull request
- Перед merge в main
- После deploy на staging

Минимальное покрытие кода: 80%
