import type { TRPCRouterRecord } from "@trpc/server";
import {
  chatGenerate,
  improveInstructions,
  improveWelcomeTemplates,
} from "./ai";
import { analytics, dashboardStats, responsesChart } from "./analytics";
import {
  create,
  deleteVacancy,
  get,
  list,
  listActive,
  update,
  updateDetails,
  updateFull,
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
