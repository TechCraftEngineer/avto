/**
 * Личная Telegram-сессия пользователя (рекрутера).
 * Технически изолирована от workspace-сессий — используется для ручного общения
 * с кандидатами, не пересекается с автоматическими интервью.
 */

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
import { user } from "../auth/user";

export const userTelegramSession = pgTable(
  "user_telegram_sessions",
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
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdx: index("user_telegram_session_user_idx").on(table.userId),
    isActiveIdx: index("user_telegram_session_is_active_idx").on(
      table.isActive,
    ),
  }),
);

export type UserTelegramSession = typeof userTelegramSession.$inferSelect;
export type NewUserTelegramSession = typeof userTelegramSession.$inferInsert;
