import type { TRPCRouterRecord } from "@trpc/server";
import { rateLimitStats } from "./rate-limit-stats";
import { cleanupTestUser, setupTestUser } from "./setup";

export const testRouter = {
  setup: setupTestUser,
  cleanup: cleanupTestUser,
  rateLimitStats,
} satisfies TRPCRouterRecord;
