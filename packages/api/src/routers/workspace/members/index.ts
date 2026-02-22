import type { ORPCRouterRecord } from "@orpc/server";

import { add } from "./add";
import { list } from "./list";
import { remove } from "./remove";
import { updateRole } from "./update-role";

export const membersRouter = {
  list,
  add,
  remove,
  updateRole,
} satisfies ORPCRouterRecord;
