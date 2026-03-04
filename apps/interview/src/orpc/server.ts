import "server-only";
import { createRouterClient } from "@orpc/server";
import { appRouter } from "@qbs-autonaim/api";
import { createContext } from "@qbs-autonaim/api/orpc";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "~/auth/server";

const createServerContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-orpc-source", "rsc");

  return createContext({
    headers: heads,
    auth,
  });
});

/**
 * Server-side ORPC клиент для SSR оптимизации
 *
 * Этот клиент используется на сервере для prefetch данных.
 * Контекст не передается - будет использоваться контекст из middleware.
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
