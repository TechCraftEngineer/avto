import type { TRPCRouterRecord } from "@trpc/server";

import { cleanup } from "./cleanup";
import { setup } from "./setup";

export const testRouter = {
  setup,
  cleanup,
} satisfies TRPCRouterRecord;
