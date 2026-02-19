import type { TRPCRouterRecord } from "@trpc/server";
import { get } from "./get";
import { list } from "./list";
import { updateStatus } from "./update-status";
import { updateTags } from "./update-tags";

export const globalCandidatesRouter = {
  list,
  get,
  updateStatus,
  updateTags,
} satisfies TRPCRouterRecord;
