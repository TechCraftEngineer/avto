import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { vacancy } from "../vacancy/vacancy";
import { workspace } from "../workspace/workspace";
import { prequalificationSession } from "./prequalification-session";

// Analytics Event Type Enum
export const analyticsEventTypeEnum = pgEnum(
  "prequalification_analytics_event_type",
  [
    "widget_view",
    "session_start",
    "resume_upload",
    "dialogue_message",
    "dialogue_complete",
    "evaluation_complete",
    "application_submit",
    "web_chat_start",
    "telegram_chat_start",
    "communication_channel_selected",
  ],
);

// Analytics Event Table
export const analyticsEvent = pgTable(
  "prequalification_analytics_events",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Workspace к которому принадлежит событие
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    // Вакансия (опционально)
    vacancyId: uuid("vacancy_id").references(() => vacancy.id, {
      onDelete: "set null",
    }),

    // Сессия преквалификации (опционально)
    sessionId: uuid("session_id").references(() => prequalificationSession.id, {
      onDelete: "set null",
    }),

    // Тип события
    eventType: analyticsEventTypeEnum("event_type").notNull(),

    // Дополнительные метаданные
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // Время события
    timestamp: timestamp("timestamp", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("preq_analytics_workspace_idx").on(table.workspaceId),
    vacancyIdx: index("preq_analytics_vacancy_idx").on(table.vacancyId),
    eventTypeIdx: index("preq_analytics_event_type_idx").on(table.eventType),
    timestampIdx: index("preq_analytics_timestamp_idx").on(table.timestamp),
    // Composite index для dashboard queries
    workspaceTimestampIdx: index("preq_analytics_workspace_timestamp_idx").on(
      table.workspaceId,
      table.timestamp,
    ),
    // Composite index для vacancy analytics
    vacancyTimestampIdx: index("preq_analytics_vacancy_timestamp_idx").on(
      table.vacancyId,
      table.timestamp,
    ),
  }),
);

// Zod schemas
export const CreateAnalyticsEventSchema = createInsertSchema(analyticsEvent, {
  workspaceId: z.string().min(1),
  vacancyId: z.uuid().optional(),
  sessionId: z.uuid().optional(),
  eventType: z.enum([
    "widget_view",
    "session_start",
    "resume_upload",
    "dialogue_message",
    "dialogue_complete",
    "evaluation_complete",
    "application_submit",
    "web_chat_start",
    "telegram_chat_start",
    "communication_channel_selected",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).omit({
  id: true,
  timestamp: true,
});

// Type exports
export type AnalyticsEvent = typeof analyticsEvent.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvent.$inferInsert;
export type AnalyticsEventType =
  (typeof analyticsEventTypeEnum.enumValues)[number];
