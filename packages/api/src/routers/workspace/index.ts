import { create } from "./create";
import { deleteWorkspace } from "./delete";
import { get } from "./get";
import { getBotSettings } from "./get-bot-settings";
import { getBySlug } from "./get-by-slug";
import { invitesRouter } from "./invites";
import { list } from "./list";
import { membersRouter } from "./members";
import { update } from "./update";
import { updateBotSettings } from "./update-bot-settings";

export const workspaceRouter = {
  list,
  get,
  getBySlug,
  getBotSettings,
  create,
  update,
  updateBotSettings,
  delete: deleteWorkspace,
  members: membersRouter,
  invites: invitesRouter,
} as any;
