
import { create } from "./create";
import { createPlanPayment } from "./create-plan-payment";
import { deleteOrganization } from "./delete";
import { get } from "./get";
import { getBySlug } from "./get-by-slug";
import { acceptInvite } from "./invites/accept";
import { createInvite } from "./invites/create";
import { deleteInvite } from "./invites/delete";
import { listInvites } from "./invites/list";
import { list } from "./list";
import { addMember } from "./members/add";
import { listMembers } from "./members/list";
import { removeMember } from "./members/remove";
import { updateMemberRole } from "./members/update-role";
import { update } from "./update";
import { updatePlan } from "./update-plan";
import { createWorkspace } from "./workspaces/create";
import { getWorkspaceBySlug } from "./workspaces/get-by-slug";
import { listWorkspaces } from "./workspaces/list";

export const organizationRouter = {
  list,
  get,
  getBySlug,
  create,
  update,
  updatePlan,
  createPlanPayment,
  delete: deleteOrganization,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  createInvite,
  listInvites,
  acceptInvite,
  deleteInvite,
  createWorkspace,
  listWorkspaces,
  getWorkspaceBySlug,
};
