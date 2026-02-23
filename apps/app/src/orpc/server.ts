import "server-only";

import { createRouterClient } from "@orpc/server";
import { appRouter } from "@qbs-autonaim/api";
import { createContext } from "@qbs-autonaim/api/orpc";
import { headers } from "next/headers";
import { cache } from "react";

const createServerContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-orpc-source", "rsc");

  return createContext({
    headers: heads,
    auth: null,
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
export { HydrateClient } from "./hydrate-client";

export { createQueryClient as makeQueryClient } from "./query-client";
export { orpc } from "./react";
