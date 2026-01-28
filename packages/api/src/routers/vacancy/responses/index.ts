import type { TRPCRouterRecord } from "@trpc/server";

import { addTag } from "./add-tag";
import { compare } from "./compare";
import { get } from "./get";
import { getCount } from "./get-count";
import { getHistory } from "./history";
import { list } from "./list";
import { listAll } from "./list-all";
import { listRecent } from "./list-recent";
import { listTags } from "./list-tags";
import { listTop } from "./list-top";
import { removeTag } from "./remove-tag";
import { sendByUsername } from "./send-by-username";
import { sendWelcome } from "./send-welcome";

export const responsesRouter = {
  list,
  listAll,
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
} satisfies TRPCRouterRecord;
