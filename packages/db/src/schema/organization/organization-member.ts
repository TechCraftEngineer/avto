import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { organization } from "./organization";

export const organizationRoleEnum = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof organizationRoleEnum)[number];

export const organizationMember = pgTable(
  "organization_members",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role", { enum: organizationRoleEnum })
      .default("member")
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.organizationId] }),
    userIdx: index("organization_member_user_idx").on(table.userId),
    organizationIdx: index("organization_member_organization_idx").on(
      table.organizationId,
    ),
    roleIdx: index("organization_member_role_idx").on(table.role),
  }),
);

export type OrganizationMember = typeof organizationMember.$inferSelect;
export type NewOrganizationMember = typeof organizationMember.$inferInsert;
