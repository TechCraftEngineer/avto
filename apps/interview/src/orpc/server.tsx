import "server-only";

import { createRouterClient } from "@orpc/server";
import type { AppRouter } from "@qbs-autonaim/api";
import { createContext } from "@qbs-autonaim/api/orpc";
import { appRouter } from "@qbs-autonaim/api/root-orpc";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { createQueryClient } from "./query-client";

const createServerContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-orpc-source", "rsc");

  return createContext({
    headers: heads,
    auth: null,
  });
});

export const getQueryClient = cache(createQueryClient);

/**
 * Server-side oRPC caller для прямого вызова процедур в Server Components
 */
export const api = cache(() => {
  return createRouterClient<AppRouter>(appRouter, {
    context: createServerContext,
  });
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
