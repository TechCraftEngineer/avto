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
import { listRecent } from "./list-recent";
import { listTags } from "./list-tags";
import { listTop } from "./list-top";
import { listWorkspace } from "./list-workspace";
import { removeTag } from "./remove-tag";
import { sendByUsername } from "./send-by-username";
import { sendWelcome } from "./send-welcome";
import { updateStatus } from "./update-status";

export const responsesRouter = {
  list,
  listAll,
  listWorkspace,
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
  updateStatus,
  debugList, // Временный debug endpoint
} satisfies TRPCRouterRecord;
