import type { TRPCRouterRecord } from "@trpc/server";

import { addTag } from "./add-tag";
import { analyzeSingle } from "./analyze-single";
import { compare } from "./compare";
import { debugList } from "./debug-list";
import { get } from "./get";
import { getCount } from "./get-count";
import { getInterviewLink } from "./get-interview-link";
import { getRefreshStatus } from "./get-refresh-status";
import { getHistory } from "./history";
import { list } from "./list";
import { listAll } from "./list-all";
import { listAllWorkspace } from "./list-all-workspace";
import { listRecent } from "./list-recent";
import { listTags } from "./list-tags";
import { listTop } from "./list-top";
import { removeTag } from "./remove-tag";
import { sendByUsername } from "./send-by-username";
import { sendWelcome } from "./send-welcome";

export const responsesRouter = {
  list,
  listAll,
  listAllWorkspace,
  listRecent,
  listTop,
  get,
  count: getCount,
  history: getHistory,
  sendWelcome,
  sendByUsername,
  compare,
  addTag,
  listTags,
  removeTag,
  getRefreshStatus,
  analyzeSingle,
  getInterviewLink,
  debugList, // Временный debug endpoint
} satisfies TRPCRouterRecord;
