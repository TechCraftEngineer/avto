import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  tempMessageContentTypeEnum,
  tempMessageSenderEnum,
} from "./temp-message";

/**
 * Буферизованные временные сообщения для неидентифицированных пользователей
 * Используется для накопления сообщений перед отправкой в AI
 * После обработки переносятся в temp_interview_messages
 */
export const bufferedTempInterviewMessage = pgTable(
  "buffered_temp_interview_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    chatId: varchar("chat_id", { length: 100 }).notNull(),
    content: text("content").notNull(),
    contentType: tempMessageContentTypeEnum("content_type")
      .default("TEXT")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    externalMessageId: varchar("external_message_id", { length: 100 }),
    messageId: varchar("message_id", { length: 100 }).notNull(),
    sender: tempMessageSenderEnum("sender").notNull(),
    tempSessionId: varchar("temp_session_id", {
      length: 100,
    }).notNull(),
    timestamp: timestamp("timestamp").notNull(),
  },
  (table) => ({
    sessionIdx: index("buffered_temp_interview_message_session_idx").on(
      table.tempSessionId,
    ),
    chatIdx: index("buffered_temp_interview_message_chat_idx").on(table.chatId),
    messageIdIdx: index("buffered_temp_interview_message_id_idx").on(
      table.messageId,
    ),
    timestampIdx: index("buffered_temp_interview_message_timestamp_idx").on(
      table.timestamp,
    ),
  }),
);

export const CreateBufferedTempInterviewMessageSchema = createInsertSchema(
  bufferedTempInterviewMessage,
  {
    messageId: z.string().min(1).max(100),
    tempSessionId: z.string().max(100),
    chatId: z.string().max(100),
    sender: z.enum(["CANDIDATE", "BOT"]),
    contentType: z.enum(["TEXT", "VOICE"]).default("TEXT"),
    content: z.string().transform((val) => val.replace(/\0/g, "")),
    externalMessageId: z.string().max(100).optional(),
    timestamp: z.date(),
  },
).omit({
  id: true,
  createdAt: true,
});

export const SelectBufferedTempInterviewMessageSchema = createSelectSchema(
  bufferedTempInterviewMessage,
);

export type BufferedTempInterviewMessage = z.infer<
  typeof SelectBufferedTempInterviewMessageSchema
>;
export type CreateBufferedTempInterviewMessage = z.infer<
  typeof CreateBufferedTempInterviewMessageSchema
>;
