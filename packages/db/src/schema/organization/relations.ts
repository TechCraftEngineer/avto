import { relations } from "drizzle-orm";
import { user } from "../auth/user";
import { candidateOrganization } from "../candidate/candidate-organization";
import { payment } from "../payment/payment";
import { workspace } from "../workspace/workspace";
import { organization } from "./organization";
import { organizationInvite } from "./organization-invite";
import { organizationMember } from "./organization-member";

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(organizationMember),
  workspaces: many(workspace),
  invites: many(organizationInvite),
  payments: many(payment),
  candidateLinks: many(candidateOrganization),
}));

export const organizationMemberRelations = relations(
  organizationMember,
  ({ one }) => ({
    user: one(user, {
      fields: [organizationMember.userId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [organizationMember.organizationId],
      references: [organization.id],
    }),
  }),
);

export const organizationInviteRelations = relations(
  organizationInvite,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationInvite.organizationId],
      references: [organization.id],
    }),
    invitedUser: one(user, {
      fields: [organizationInvite.invitedUserId],
      references: [user.id],
    }),
    creator: one(user, {
      fields: [organizationInvite.createdBy],
      references: [user.id],
    }),
  }),
);
