import type { AppRouter } from "@qbs-autonaim/api";
import { appRouter, createTRPCContext } from "@qbs-autonaim/api";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { TRPCQueryOptions } from "@trpc/tanstack-react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { createQueryClient } from "./query-client";

const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
    auth: null,
  });
});

const getQueryClient = cache(createQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  router: appRouter,
  ctx: createContext,
  queryClient: getQueryClient,
});

export const api = cache(async () => {
  const context = await createContext();
  return appRouter.createCaller(context);
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

// biome-ignore lint/suspicious/noExplicitAny: Required for TRPC type compatibility
export function prefetch<T extends ReturnType<TRPCQueryOptions<unknown>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    // biome-ignore lint/suspicious/noExplicitAny: Required for TRPC type compatibility
    void queryClient.prefetchInfiniteQuery(queryOptions as unknown);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}
