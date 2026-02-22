import type { ORPCRouterRecord } from "@orpc/server";
import { analytics } from "./analytics";
import { list } from "./list";
import { updateStage } from "./update-stage";
import { vacancyStats } from "./vacancy-stats";

export const funnelRouter = {
  list,
  analytics,
  updateStage,
  vacancyStats,
} satisfies ORPCRouterRecord;
