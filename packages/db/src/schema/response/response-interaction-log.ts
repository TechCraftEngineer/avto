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

export const interactionTypeEnum = pgEnum("response_interaction_type", [
  "welcome_sent",
  "message_sent",
  "interview_scheduled",
  "interview_started",
  "interview_completed",
  "offer_sent",
  "rejection_sent",
  "call",
  "email_sent",
  "meeting",
  "note",
  "followup_sent",
]);

export const interactionSourceEnum = pgEnum("response_interaction_source", [
  "auto",
  "manual",
]);

export const interactionChannelEnum = pgEnum("response_interaction_channel", [
  "telegram",
  "phone",
  "email",
  "kwork",
  "in_person",
  "web_chat",
  "whatsapp",
  "other",
]);

/**
 * Журнал взаимодействий с откликом (кандидат + вакансия/гиг).
 * Объединяет автоматические события и ручные записи рекрутера.
 */
export const responseInteractionLog = pgTable(
  "response_interaction_log",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    responseId: uuid("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),
    interactionType: interactionTypeEnum("interaction_type").notNull(),
    source: interactionSourceEnum("source").notNull(),
    happenedAt: timestamp("happened_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    channel: interactionChannelEnum("channel"),
    note: text("note"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("response_interaction_log_response_idx").on(table.responseId),
    index("response_interaction_log_response_happened_idx").on(
      table.responseId,
      table.happenedAt,
    ),
  ],
);

export const interactionTypeValues = interactionTypeEnum.enumValues;
export const interactionSourceValues = interactionSourceEnum.enumValues;
export const interactionChannelValues = interactionChannelEnum.enumValues;

export type ResponseInteractionLog = typeof responseInteractionLog.$inferSelect;
export type NewResponseInteractionLog =
  typeof responseInteractionLog.$inferInsert;
export type InteractionType = (typeof interactionTypeValues)[number];
export type InteractionSource = (typeof interactionSourceValues)[number];
export type InteractionChannel = (typeof interactionChannelValues)[number];

export const CreateResponseInteractionLogSchema = createInsertSchema(
  responseInteractionLog,
  {
    responseId: z.string().uuid(),
    interactionType: z.enum(interactionTypeValues),
    source: z.enum(interactionSourceValues),
    happenedAt: z.coerce.date(),
    channel: z.enum(interactionChannelValues).optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  },
).omit({
  id: true,
  createdAt: true,
});
