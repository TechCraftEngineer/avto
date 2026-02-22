import type { ORPCRouterRecord } from "@orpc/server";

import { checkWorkspaceAccess } from "./check-workspace-access";
import { clearActiveWorkspace } from "./clear-active-workspace";
import { deleteUser } from "./delete";
import { me } from "./me";
import { setActiveWorkspace } from "./set-active-workspace";
import { update } from "./update";

export const userRouter = {
  me,
  update,
  delete: deleteUser,
  setActiveWorkspace,
  checkWorkspaceAccess,
  clearActiveWorkspace,
} satisfies ORPCRouterRecord;
