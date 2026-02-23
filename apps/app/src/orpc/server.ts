import "server-only";

import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { appRouter } from "@qbs-autonaim/api";
import { createContext } from "@qbs-autonaim/api/orpc";
import { dehydrate } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "~/auth/server";
import { createQueryClient } from "./query-client";

const createServerContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-orpc-source", "rsc");

  return createContext({
    headers: heads,
    auth,
  });
});
/**
 * This is part of the Optimize SSR setup.
 *
 * @see {@link https://orpc.dev/docs/adapters/next#optimize-ssr}
 */
globalThis.$client = createRouterClient(appRouter, {
  /**
   * Context is provided per-request through the router's middleware.
   * No initial context needed for SSR optimization.
   */
  context: createServerContext,
});

export const api = globalThis.$client;

/**
 * Создаёт server helpers для prefetch и гидратации.
 * Используется в серверных компонентах для загрузки данных на сервере.
 */
export async function createServerHelpers() {
  const queryClient = createQueryClient();
  const orpc = createTanstackQueryUtils(globalThis.$client!);

  return {
    queryClient,
    /** Prefetch данные для передачи клиенту через dehydrate */
    prefetch: {
      workspace: {
        list: {
          prefetch: () =>
            queryClient.prefetchQuery(orpc.workspace.list.queryOptions()),
        },
      },
    },
    /** Состояние для HydrationBoundary */
    dehydrate: () => dehydrate(queryClient),
  };
}

export { HydrateClient } from "./hydrate-client";

export { createQueryClient as makeQueryClient } from "./query-client";
export { orpc } from "./react";
