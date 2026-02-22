import type { TRPCRouterRecord } from "@trpc/server";
import { cleanup } from "./cleanup";
import { createArchivedVacancy } from "./create-archived-vacancy";
import { setup } from "./setup";

export const testRouter = {
  setup,
  cleanup,
  createArchivedVacancy,
} satisfies TRPCRouterRecord;
