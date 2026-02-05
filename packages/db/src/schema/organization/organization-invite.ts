import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { organization } from "./organization";
import { organizationRoleEnum } from "./organization-member";

export const organizationInvite = pgTable(
  "organization_invites",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    invitedEmail: text("invited_email"),
    invitedUserId: text("invited_user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role", { enum: organizationRoleEnum })
      .default("member")
      .notNull(),
    token: text("token").notNull().unique(),
  },
  (table) => ({
    organizationIdx: index("organization_invite_organization_idx").on(
      table.organizationId,
    ),
    tokenIdx: index("organization_invite_token_idx").on(table.token),
    expiresIdx: index("organization_invite_expires_idx").on(table.expiresAt),
  }),
);

export type OrganizationInvite = typeof organizationInvite.$inferSelect;
export type NewOrganizationInvite = typeof organizationInvite.$inferInsert;
