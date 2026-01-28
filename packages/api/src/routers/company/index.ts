import type { TRPCRouterRecord } from "@trpc/server";

import { get } from "./get";
import { update } from "./update";
import { updateOnboarding } from "./update-onboarding";
import { updatePartial } from "./update-partial";

export const botRouter = {
  get,
  update,
  updatePartial,
  updateOnboarding,
} satisfies TRPCRouterRecord;
