import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspace } from "./workspace";

export const botSettings = pgTable(
  "bot_settings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    botName: text("bot_name").default("Дмитрий").notNull(),
    botRole: text("bot_role").default("рекрутер").notNull(),
    companyDescription: text("company_description"),
    companyName: text("company_name").notNull(),
    companyWebsite: text("company_website"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" })
      .unique(),
  },
  (table) => ({
    workspaceIdx: index("bot_settings_workspace_idx").on(table.workspaceId),
  }),
);

export type BotSettings = typeof botSettings.$inferSelect;
export type NewBotSettings = typeof botSettings.$inferInsert;
