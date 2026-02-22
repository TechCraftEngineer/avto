import { createServerCaller } from "@orpc/server";
import { appRouter, createContext } from "@qbs-autonaim/api";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { createQueryClient } from "./query-client";

const createORPCContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-orpc-source", "rsc");

  return createContext({
    headers: heads,
    auth: null,
  });
});

const getQueryClient = cache(createQueryClient);

export const api = cache(async () => {
  const context = await createORPCContext();
  return createServerCaller(appRouter, context);
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
