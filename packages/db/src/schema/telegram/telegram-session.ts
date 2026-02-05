import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { workspace } from "../workspace/workspace";

export const telegramSession = pgTable(
  "telegram_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    apiHash: text("api_hash").notNull(),
    apiId: text("api_id").notNull(),
    authError: text("auth_error"),
    authErrorAt: timestamp("auth_error_at", {
      withTimezone: true,
      mode: "date",
    }),
    authErrorNotifiedAt: timestamp("auth_error_notified_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
    phone: text("phone").notNull(),
    sessionData: jsonb("session_data").notNull().$type<{
      authKey?: string;
      dcId?: number;
      userId?: string;
      [key: string]: unknown;
    }>(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userInfo: jsonb("user_info").$type<{
      id?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      phone?: string;
    }>(),
    workspaceId: text("workspace_id")
      .notNull()
      .unique()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => ({
    workspaceIdx: index("telegram_session_workspace_idx").on(table.workspaceId),
    isActiveIdx: index("telegram_session_is_active_idx").on(table.isActive),
    sessionDataIdx: index("telegram_session_data_idx").using(
      "gin",
      table.sessionData,
    ),
    userInfoIdx: index("telegram_session_user_info_idx").using(
      "gin",
      table.userInfo,
    ),
  }),
);

export type TelegramSession = typeof telegramSession.$inferSelect;
export type NewTelegramSession = typeof telegramSession.$inferInsert;
