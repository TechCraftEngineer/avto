import type { TRPCRouterRecord } from "@trpc/server";

import { createArchivedVacancy } from "./create-archived-vacancy";
import { cleanup } from "./cleanup";
import { setup } from "./setup";

export const testRouter = {
  setup,
  cleanup,
  createArchivedVacancy,
} satisfies TRPCRouterRecord;
