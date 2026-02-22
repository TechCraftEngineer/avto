import { aiChatRouter, chatGenerate } from "./chat";
import {
  create,
  deleteGig,
  duplicate,
  get,
  list,
  listActive,
  toggleActive,
  update,
} from "./crud";
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
  duplicate,
  toggleActive,
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
} as any;
