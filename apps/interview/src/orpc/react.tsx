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
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  } else {
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

export const { useORPC, ORPCProvider } = createORPCContext<AppRouter>();

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

            // Для интервью приложений добавляем токен из URL pathname
            if (typeof window !== "undefined") {
              const pathParts = window.location.pathname
                .split("/")
                .filter(Boolean);
              if (pathParts.length > 0) {
                const token = pathParts[0];
                // Проверяем что это не стандартный маршрут (interview, auth, etc.)
                if (token && !["interview", "auth", "api"].includes(token)) {
                  headers.set("x-interview-token", token);
                }
              }
            }

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

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return `http://localhost:${env.PORT}`;
};

export type { RouterInputs, RouterOutputs } from "@qbs-autonaim/api";
