"use client";

import { createORPCClient } from "@orpc/client";
import { createRouterUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "@qbs-autonaim/api";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import SuperJSON from "superjson";

import { env } from "~/env";
import { createQueryClient } from "./query-client";

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

const createORPCClientInstance = () => {
  const client = createORPCClient<AppRouter>({
    transformer: SuperJSON,
    baseURL: `${getBaseUrl()}/api/orpc`,
  } as any);

  // Добавляем кастомные заголовки через перехват fetch
  const originalFetch = client.fetch.bind(client);
  client.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set("x-orpc-source", "nextjs-react");

    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const token = pathParts[0];
        if (token && !["interview", "auth", "api"].includes(token)) {
          headers.set("x-interview-token", token);
        }
      }
    }

    return originalFetch(input, { ...init, headers });
  };

  return client;
};

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

export const useORPC = () => {
  const client = getORPCClient();
  return createRouterUtils<AppRouter>(client, { path: [] });
};

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

export type { RouterInputs, RouterOutputs } from "@qbs-autonaim/api";
