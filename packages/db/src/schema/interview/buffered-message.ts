import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { interviewSession } from "./interview-session";

/**
 * Таблица для хранения буферизованных сообщений интервью
 * Каждое сообщение в отдельной строке для предотвращения затирания
 * при конкурентных операциях (когда кандидат отправляет несколько сообщений подряд)
 */
export const bufferedMessage = pgTable(
  "buffered_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    content: varchar("content", { length: 10000 }).notNull(),
    contentType: varchar("content_type", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    flushId: varchar("flush_id", { length: 100 }),
    interviewSessionId: uuid("interview_session_id")
      .notNull()
      .references(() => interviewSession.id, {
        onDelete: "cascade",
      }),
    interviewStep: integer("interview_step").notNull(),
    messageId: varchar("message_id", { length: 100 }).notNull(),
    questionContext: varchar("question_context", { length: 1000 }),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    userId: varchar("user_id", { length: 100 }).notNull(),
  },
  (table) => ({
    interviewSessionStepIdx: index(
      "buffered_message_interview_session_step_idx",
    ).on(table.interviewSessionId, table.interviewStep),
    userIdx: index("buffered_message_user_idx").on(table.userId),
    messageIdIdx: index("buffered_message_id_idx").on(table.messageId),
    timestampIdx: index("buffered_message_timestamp_idx").on(table.timestamp),
  }),
);

/**
 * Zod схемы для валидации
 */
export const CreateBufferedMessageSchema = createInsertSchema(bufferedMessage, {
  messageId: z.string().min(1),
  interviewSessionId: z.uuid(),
  userId: z.string().min(1),
  interviewStep: z.number().int().min(0),
  content: z.string().min(1),
  contentType: z.enum(["TEXT", "VOICE"]),
  questionContext: z.string().optional(),
  timestamp: z.number(),
  flushId: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const SelectBufferedMessageSchema = createSelectSchema(bufferedMessage);

export type BufferedMessage = z.infer<typeof SelectBufferedMessageSchema>;
export type CreateBufferedMessage = z.infer<typeof CreateBufferedMessageSchema>;
