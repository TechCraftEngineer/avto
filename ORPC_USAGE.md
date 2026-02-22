# Використання ORPC з TanStack Query

## Огляд

Проект використовує ORPC для type-safe API комунікації між клієнтом та сервером. ORPC інтегрований з TanStack Query для управління станом сервера.

## Структура

```
packages/api/
├── src/
│   ├── orpc.ts              # Конфігурація ORPC (context, procedures)
│   ├── root-orpc.ts         # Головний роутер (appRouter)
│   └── routers/             # Доменні роутери
│       ├── user/
│       │   ├── index.ts     # Експорт userRouter
│       │   ├── me.ts        # Query: отримати поточного користувача
│       │   └── update.ts    # Mutation: оновити користувача
│       └── ...

apps/app/
├── src/
│   ├── orpc/
│   │   ├── react.tsx        # Client-side ORPC клієнт
│   │   ├── server.ts        # Server-side ORPC клієнт (SSR)
│   │   └── query-client.ts  # Конфігурація QueryClient
│   └── app/
│       └── layout.tsx       # ORPCReactProvider

apps/interview/
├── src/
│   ├── orpc/
│   │   ├── react.tsx        # Client-side ORPC клієнт
│   │   ├── server.ts        # Server-side ORPC клієнт (SSR)
│   │   └── query-client.ts  # Конфігурація QueryClient
│   └── app/
│       └── layout.tsx       # ORPCReactProvider
```

## Client-side використання

### 1. Queries (читання даних)

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

export function UserProfile() {
  const orpc = useORPC();

  // Базовий query
  const { data, isPending, error } = useQuery(
    orpc.user.me.queryOptions()
  );

  if (isPending) return <div>Завантаження...</div>;
  if (error) return <div>Помилка: {error.message}</div>;

  return <div>{data.name}</div>;
}
```

### 2. Mutations (зміна даних)

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

export function UpdateUserForm() {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    orpc.user.update.mutationOptions({
      onSuccess: () => {
        // Інвалідуємо query після успішного оновлення
        queryClient.invalidateQueries({
          queryKey: orpc.user.me.queryKey(),
        });
      },
      onError: (error) => {
        console.error("Помилка оновлення:", error);
      },
    })
  );

  return (
    <button
      onClick={() => mutate({ name: "Нове ім'я" })}
      disabled={isPending}
    >
      {isPending ? "Оновлення..." : "Оновити"}
    </button>
  );
}
```

### 3. Умовні запити (skipToken)

```tsx
import { skipToken, useQuery } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

export function ConditionalQuery({ userId }: { userId?: string }) {
  const orpc = useORPC();

  const { data } = useQuery(
    orpc.user.getById.queryOptions(
      userId ? { id: userId } : skipToken
    )
  );

  return data ? <div>{data.name}</div> : null;
}
```

### 4. Suspense queries

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

export function UserProfileSuspense() {
  const orpc = useORPC();

  // Автоматично показує Suspense fallback під час завантаження
  const { data } = useSuspenseQuery(
    orpc.user.me.queryOptions()
  );

  return <div>{data.name}</div>;
}
```

### 5. Оптимістичні оновлення

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

export function OptimisticUpdate() {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const { mutate } = useMutation(
    orpc.user.update.mutationOptions({
      onMutate: async (newData) => {
        // Скасовуємо поточні запити
        await queryClient.cancelQueries({
          queryKey: orpc.user.me.queryKey(),
        });

        // Зберігаємо попередні дані
        const previousUser = queryClient.getQueryData(
          orpc.user.me.queryKey()
        );

        // Оптимістично оновлюємо кеш
        queryClient.setQueryData(
          orpc.user.me.queryKey(),
          (old) => ({ ...old, ...newData })
        );

        return { previousUser };
      },
      onError: (err, newData, context) => {
        // Відкочуємо зміни при помилці
        if (context?.previousUser) {
          queryClient.setQueryData(
            orpc.user.me.queryKey(),
            context.previousUser
          );
        }
      },
      onSettled: () => {
        // Синхронізуємо з сервером
        queryClient.invalidateQueries({
          queryKey: orpc.user.me.queryKey(),
        });
      },
    })
  );

  return <button onClick={() => mutate({ name: "Нове ім'я" })}>Оновити</button>;
}
```

## Server-side використання (SSR)

### Prefetch даних на сервері

```tsx
import { HydrationBoundary, dehydrate, QueryClient } from "@tanstack/react-query";
import "~/orpc/server"; // Ініціалізує globalThis.$client

export default async function Page() {
  const queryClient = new QueryClient();

  // Prefetch даних на сервері
  await queryClient.prefetchQuery(
    globalThis.$client.user.me.queryOptions()
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfile />
    </HydrationBoundary>
  );
}
```

## Інвалідація кешу

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

export function InvalidateExample() {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  // Інвалідувати конкретний query
  queryClient.invalidateQueries({
    queryKey: orpc.user.me.queryKey(),
  });

  // Інвалідувати всі queries користувача
  queryClient.invalidateQueries({
    queryKey: orpc.user.queryKey(),
  });

  // Інвалідувати всі ORPC queries
  queryClient.invalidateQueries({
    queryKey: orpc.queryKey(),
  });
}
```

## Type inference

```tsx
import type { RouterInputs, RouterOutputs } from "@qbs-autonaim/api";

// Тип input для user.update
type UpdateUserInput = RouterInputs["user"]["update"];

// Тип output для user.me
type User = RouterOutputs["user"]["me"];
```

## Важливі правила

1. **MUST**: Використовувати `useORPC()` для отримання клієнта
2. **MUST**: Використовувати `.queryOptions()` для queries
3. **MUST**: Використовувати `.mutationOptions()` для mutations
4. **MUST**: Використовувати `.queryKey()` для інвалідації
5. **NEVER**: Не викликати процедури напряму (наприклад, `orpc.user.me()`)
6. **MUST**: Передавати результати фабрик в нативні хуки TanStack Query

## Приклади компонентів

Дивіться приклади використання:
- `apps/app/src/app/_components/orpc-example.tsx`
- `apps/interview/src/app/_components/orpc-example.tsx`
