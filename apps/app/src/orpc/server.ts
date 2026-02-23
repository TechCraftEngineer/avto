import "server-only";

import { createRouterClient } from "@orpc/server";
import { appRouter } from "@qbs-autonaim/api";

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
});
