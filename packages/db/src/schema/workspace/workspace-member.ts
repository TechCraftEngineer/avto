import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { workspace } from "./workspace";

export const workspaceMemberRoleEnum = ["owner", "admin", "member"] as const;
export type WorkspaceMemberRole = (typeof workspaceMemberRoleEnum)[number];

export const workspaceMember = pgTable(
  "workspace_members",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    role: text("role", { enum: workspaceMemberRoleEnum })
      .default("member")
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.workspaceId] }),
    userIdx: index("workspace_member_user_idx").on(table.userId),
    workspaceIdx: index("workspace_member_workspace_idx").on(table.workspaceId),
    roleIdx: index("workspace_member_role_idx").on(table.role),
  }),
);

export type WorkspaceMember = typeof workspaceMember.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMember.$inferInsert;
