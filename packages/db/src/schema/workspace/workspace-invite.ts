import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspace } from "./workspace";

export const workspaceInvite = pgTable(
  "workspace_invites",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    createdBy: text("created_by").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    invitedEmail: text("invited_email"),
    invitedUserId: text("invited_user_id"),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .default("member")
      .notNull(),
    token: text("token").notNull().unique(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => ({
    workspaceIdx: index("workspace_invite_workspace_idx").on(table.workspaceId),
    tokenIdx: index("workspace_invite_token_idx").on(table.token),
    expiresIdx: index("workspace_invite_expires_idx").on(table.expiresAt),
  }),
);

export type WorkspaceInvite = typeof workspaceInvite.$inferSelect;
export type NewWorkspaceInvite = typeof workspaceInvite.$inferInsert;
