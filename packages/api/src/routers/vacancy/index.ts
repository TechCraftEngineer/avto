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
import { refreshStatus } from "./refresh-status";
import { responsesRouter } from "./responses";
import { createFromChat } from "./special";

export const vacancyRouter = {
  list,
  listActive,
  get,
  getInterviewLink,
  refreshStatus,
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
} as any;
