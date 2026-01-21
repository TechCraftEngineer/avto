import type { TRPCRouterRecord } from "@trpc/server";

import { analytics } from "./analytics";
import { chatGenerate } from "./chat-generate";
import { create } from "./create";
import { createFromChat } from "./create-from-chat";
import { dashboardStats } from "./dashboard-stats";
import { deleteVacancy } from "./delete";
import { get } from "./get";
import { improveInstructions } from "./improve-instructions";
import { list } from "./list";
import { listActive } from "./list-active";
import { responsesRouter } from "./responses";
import { responsesChart } from "./responses-chart";
import { update } from "./update";
import { updateDetails } from "./update-details";
import { updateFull } from "./update-full";

export const vacancyRouter = {
  list,
  listActive,
  get,
  create,
  createFromChat,
  analytics,
  dashboardStats,
  responsesChart,
  update,
  updateDetails,
  updateFull,
  delete: deleteVacancy,
  improveInstructions,
  chatGenerate,
  responses: responsesRouter,
} satisfies TRPCRouterRecord;
