import type { AppRouter } from "@qbs-autonaim/api";
import { createContext } from "@qbs-autonaim/api/orpc";
import { appRouter } from "@qbs-autonaim/api/root-orpc";
import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "~/auth/server";
import { createQueryClient } from "~/trpc/query-client";

/**
 * Создание контекста для oRPC на сервере
 * Оборачивает createContext и предоставляет необходимый контекст для oRPC API
 * при обработке вызова из React Server Component
 *
 * @see Requirements 7.5, 11.2, 11.3
 */
const createServerContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-orpc-source", "rsc");

  return createContext({
    headers: heads,
    auth,
  });
});

/**
 * Получение Query Client для серверных компонентов
 * Использует cache для переиспользования в рамках одного запроса
 */
export const getQueryClient = cache(createQueryClient);

/**
 * Утилиты для prefetch данных в Server Components
 * Предоставляет методы для предзагрузки данных на сервере
 *
 * @see Requirements 7.5, 11.2, 11.3
 *
 * @example
 * ```tsx
 * // В Server Component
 * export default async function Page({ params }: { params: { id: string } }) {
 *   const orpc = await createServerHelpers();
 *
 *   // Prefetch данных
 *   await orpc.workspace.get.prefetch({ id: params.id });
 *
 *   return (
 *     <HydrateClient>
 *       <WorkspaceDetails id={params.id} />
 *     </HydrateClient>
 *   );
 * }
 * ```
 */
export const createServerHelpers = cache(async () => {
  const queryClient = getQueryClient();
  const ctx = await createServerContext();

  /**
   * Создает хелперы для конкретного роутера
   */
  const createRouterHelpers = (router: any, path: string[]): any => {
    const helpers: Record<string, any> = {};

    for (const [key, value] of Object.entries(router)) {
      const currentPath = [...path, key];

      // Если это процедура oRPC (имеет метод handler)
      if (value && typeof value === "object" && "handler" in value) {
        helpers[key] = {
          /**
           * Prefetch данных для query процедуры
           */
          prefetch: async (input?: any) => {
            const queryKey = ["orpc", ...currentPath, { input }];
            await queryClient.prefetchQuery({
              queryKey,
              queryFn: async () => {
                // Вызываем процедуру напрямую с контекстом
                return value.handler({ input, context: ctx });
              },
            });
          },

          /**
           * Fetch данных для query процедуры
           */
          fetch: async (input?: any) => {
            const queryKey = ["orpc", ...currentPath, { input }];
            return queryClient.fetchQuery({
              queryKey,
              queryFn: async () => {
                // Вызываем процедуру напрямую с контекстом
                return value.handler({ input, context: ctx });
              },
            });
          },

          /**
           * Получить query key для процедуры
           */
          queryKey: (input?: any) => {
            return ["orpc", ...currentPath, { input }];
          },
        };
      }
      // Если это вложенный роутер
      else if (value && typeof value === "object") {
        helpers[key] = createRouterHelpers(value, currentPath);
      }
    }

    return helpers;
  };

  return createRouterHelpers(appRouter, []) as ServerHelpers<AppRouter>;
});

/**
 * Типы для серверных хелперов
 * Предоставляет типобезопасные методы для prefetch
 */
type ProcedureHelper = {
  prefetch: (input?: any) => Promise<void>;
  fetch: (input?: any) => Promise<any>;
  queryKey: (input?: any) => unknown[];
};

type ServerHelpers<TRouter> = {
  [K in keyof TRouter]: TRouter[K] extends { handler: any }
    ? ProcedureHelper
    : TRouter[K] extends Record<string, any>
      ? ServerHelpers<TRouter[K]>
      : never;
};
