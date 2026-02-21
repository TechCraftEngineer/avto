import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user";

/**
 * User-scoped integrations (Google Calendar, Outlook и т.д.)
 * Отличается от workspace integration — привязан к пользователю, не к workspace.
 * Используется для личного календаря при планировании встреч с кандидатами.
 */
export const userIntegration = pgTable(
  "user_integrations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    type: text("type").notNull(),
    name: text("name").notNull(),

    credentials: jsonb("credentials")
      .notNull()
      .$type<Record<string, string>>(),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userTypeUnique: unique().on(table.userId, table.type),
    userIdx: index("user_integration_user_idx").on(table.userId),
    typeIdx: index("user_integration_type_idx").on(table.type),
    activeIdx: index("user_integration_active_idx")
      .on(table.userId, table.isActive)
      .where(sql`${table.isActive} = true`),
  }),
);

export type UserIntegration = typeof userIntegration.$inferSelect;
export type NewUserIntegration = typeof userIntegration.$inferInsert;
