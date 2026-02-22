"use client";

import {
  createORPCClient,
  httpBatchStreamLink,
  loggerLink,
} from "@orpc/client";
import { createORPCContext } from "@orpc/tanstack-react-query";
import type { AppRouter } from "@qbs-autonaim/api";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import SuperJSON from "superjson";

import { env } from "~/env";
import { createQueryClient } from "~/trpc/query-client";

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

export const { useORPC, useORPCClient, ORPCProvider } =
  createORPCContext<AppRouter>();

export function ORPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [orpcClient] = useState(() =>
    createORPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: `${getBaseUrl()}/api/orpc`,
          headers() {
            const headers = new Headers();
            headers.set("x-orpc-source", "nextjs-react");
            return headers;
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "same-origin",
            }).catch((error) => {
              // Логируем ошибки сети для отладки
              console.error("[ORPC] Ошибка сети:", error);
              throw error;
            });
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

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return `http://localhost:${env.PORT}`;
};
