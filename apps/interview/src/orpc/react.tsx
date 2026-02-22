"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createRouterUtils } from "@orpc/tanstack-query";
import type { appRouter } from "@qbs-autonaim/api";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";

import { env } from "~/env";
import { createQueryClient } from "./query-client";

/**
 * Глобальная переменная для SSR оптимизации
 * Устанавливается в orpc/server.ts
 */
declare global {
  // eslint-disable-next-line no-var
  var $client: RouterClient<typeof appRouter> | undefined;
}

let clientQueryClientSingleton: QueryClient | undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  } else {
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  // В development режиме используем interview-server на порту 3002
  if (env.NODE_ENV === "development") {
    return "http://localhost:3002";
  }
  return `http://localhost:${env.PORT}`;
};

// Создаем RPCLink с кастомными заголовками
const link = new RPCLink({
  url: `${getBaseUrl()}/api/orpc`,
  headers: () => {
    const headers: Record<string, string> = {
      "x-orpc-source": "nextjs-react",
    };

    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const token = pathParts[0];
        if (token && !["interview", "auth", "api"].includes(token)) {
          headers["x-interview-token"] = token;
        }
      }
    }

    return headers;
  },
});

// Создаем oRPC клиент (используем глобальный $client если доступен для SSR оптимизации)
const client: RouterClient<typeof appRouter> =
  globalThis.$client ?? createORPCClient(link);

// Создаем утилиты для TanStack Query - предоставляет .queryOptions(), .mutationOptions(), .queryKey()
export const orpc = createRouterUtils(client);

/**
 * Хук для получения типизированного oRPC клиента с TanStack Query утилитами
 */
export const useORPC = () => {
  return orpc;
};

export function ORPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}

export type { RouterInputs, RouterOutputs } from "@qbs-autonaim/api";
