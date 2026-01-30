import type { TRPCRouterRecord } from "@trpc/server";

import {
  analytics,
  dashboardStats,
  responsesChart,
} from "./analytics";
import {
  chatGenerate,
  improveInstructions,
  improveWelcomeTemplates,
} from "./ai";
import {
  create,
  get,
  list,
  listActive,
  update,
  updateDetails,
  updateFull,
  deleteVacancy,
} from "./crud";
import { getInterviewLink } from "./interview";
import { responsesRouter } from "./responses";
import { createFromChat } from "./special";

export const vacancyRouter = {
  list,
  listActive,
  get,
  getInterviewLink,
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
  improveWelcomeTemplates,
  chatGenerate,
  responses: responsesRouter,
} satisfies TRPCRouterRecord;
