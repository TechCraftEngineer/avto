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

import { user } from "../auth";
import { response } from "./response";

export const responseEventTypeEnum = pgEnum("response_event_type", [
  "STATUS_CHANGED",
  "HR_STATUS_CHANGED",
  "TELEGRAM_USERNAME_ADDED",
  "CHAT_ID_ADDED",
  "PHONE_ADDED",
  "EMAIL_ADDED",
  "RESUME_UPDATED",
  "PHOTO_ADDED",
  "WELCOME_SENT",
  "OFFER_SENT",
  "COMMENT_ADDED",
  "SALARY_UPDATED",
  "CONTACT_INFO_UPDATED",
  "CREATED",
  "SCREENING_COMPLETED",
  "INTERVIEW_STARTED",
  "INTERVIEW_COMPLETED",
  "CANDIDATE_LINKED",
]);

/**
 * История изменений откликов
 */
export const responseHistory = pgTable(
  "response_history",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    eventType: responseEventTypeEnum("event_type").notNull(),
    metadata: jsonb("metadata"),
    newValue: jsonb("new_value"),
    oldValue: jsonb("old_value"),
    responseId: uuid("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [
    index("response_history_response_idx").on(table.responseId),
    index("response_history_event_type_idx").on(table.eventType),
    index("response_history_user_idx").on(table.userId),
    index("response_history_created_at_idx").on(table.createdAt),
    index("response_history_response_created_idx").on(
      table.responseId,
      table.createdAt,
    ),
  ],
);

export const responseEventTypeValues = [
  "STATUS_CHANGED",
  "HR_STATUS_CHANGED",
  "TELEGRAM_USERNAME_ADDED",
  "CHAT_ID_ADDED",
  "PHONE_ADDED",
  "EMAIL_ADDED",
  "RESUME_UPDATED",
  "PHOTO_ADDED",
  "WELCOME_SENT",
  "OFFER_SENT",
  "COMMENT_ADDED",
  "SALARY_UPDATED",
  "CONTACT_INFO_UPDATED",
  "CREATED",
  "SCREENING_COMPLETED",
  "INTERVIEW_STARTED",
  "INTERVIEW_COMPLETED",
  "CANDIDATE_LINKED",
] as const;

export const CreateResponseHistorySchema = createInsertSchema(responseHistory, {
  responseId: z.string().uuid(),
  eventType: z.enum(responseEventTypeValues),
  userId: z.string().optional(),
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
  metadata: z.any().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type ResponseHistory = typeof responseHistory.$inferSelect;
export type NewResponseHistory = typeof responseHistory.$inferInsert;
export type ResponseEventType = (typeof responseEventTypeValues)[number];
