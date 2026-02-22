import "server-only";

import { createRouterClient } from "@orpc/server";
import { appRouter } from "@qbs-autonaim/api";
import { headers } from "next/headers";

/**
 * Server-side ORPC клиент для SSR оптимизации
 *
 * Этот клиент используется на сервере для prefetch данных.
 * Контекст не передается - будет использоваться контекст из middleware.
 *
 * @see {@link https://orpc.dev/docs/adapters/next#optimize-ssr}
 */
globalThis.$client = createRouterClient(appRouter, {
  headers: await headers(),
});
