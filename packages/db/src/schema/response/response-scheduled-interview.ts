import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { response } from "./response";

/**
 * Запланированное собеседование (событие из Google Calendar)
 * Снимок на момент планирования — синхронизация с GC не выполняется
 */
export const responseScheduledInterview = pgTable(
  "response_scheduled_interviews",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    responseId: uuid("response_id")
      .notNull()
      .unique()
      .references(() => response.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(60),
    calendarEventId: varchar("calendar_event_id", { length: 255 }),
    calendarEventUrl: varchar("calendar_event_url", { length: 2048 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("response_scheduled_interview_response_idx").on(table.responseId),
  ],
);

export type ResponseScheduledInterview =
  typeof responseScheduledInterview.$inferSelect;
export type NewResponseScheduledInterview =
  typeof responseScheduledInterview.$inferInsert;
