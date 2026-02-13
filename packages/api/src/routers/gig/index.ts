import type { TRPCRouterRecord } from "@trpc/server";

import { aiChatRouter, chatGenerate } from "./chat";
import { create, deleteGig, get, list, listActive, update } from "./crud";
import { generateInterviewLink, getInterviewLink } from "./interview";
import { gigKworkRouter } from "./kwork";
import { gigResponsesRouter } from "./responses";
import { getGigShortlist, recalculateGigShortlist } from "./shortlist";
import { syncAllResponseCounts, syncResponseCounts } from "./sync";
import { generateInvitationTemplate } from "./templates";

export const gigRouter = {
  list,
  listActive,
  get,
  create,
  update,
  delete: deleteGig,
  chatGenerate,
  generateInterviewLink,
  getInterviewLink,
  generateInvitationTemplate,
  syncResponseCounts,
  syncAllResponseCounts,
  shortlist: getGigShortlist,
  recalculateShortlist: recalculateGigShortlist,
  responses: gigResponsesRouter,
  aiChat: aiChatRouter,
  kwork: gigKworkRouter,
} satisfies TRPCRouterRecord;
