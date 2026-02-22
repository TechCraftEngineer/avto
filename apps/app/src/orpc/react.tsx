"use client";

import { createORPCClient } from "@orpc/client";
import { createRouterUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "@qbs-autonaim/api";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import SuperJSON from "superjson";

import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: всегда создаем новый query client
    return createQueryClient();
  } else {
    // Browser: используем singleton паттерн для сохранения одного query client
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
};

// Создаем oRPC клиент для использования в хуках
const createORPCClientInstance = () =>
  createORPCClient<AppRouter>({
    transformer: SuperJSON,
    baseURL: `${getBaseUrl()}/api/orpc`,
  });

// Создаем утилиты роутера для использования в компонентах
let orpcClientSingleton:
  | ReturnType<typeof createORPCClient<AppRouter>>
  | undefined;
const getORPCClient = () => {
  if (typeof window === "undefined") {
    return createORPCClientInstance();
  } else {
    return (orpcClientSingleton ??= createORPCClientInstance());
  }
};

/**
 * Хук для получения типизированного oRPC клиента
 */
export const useORPC = () => {
  const client = getORPCClient();
  return createRouterUtils<AppRouter>(client, { path: [] });
};

/**
 * Хук для получения базового oRPC клиента
 */
export const useORPCClient = () => {
  return getORPCClient();
};

export function ORPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
