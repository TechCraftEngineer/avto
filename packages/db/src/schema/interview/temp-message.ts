import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tempMessageSenderEnum = pgEnum("temp_message_sender", [
  "CANDIDATE",
  "BOT",
]);

export const tempMessageContentTypeEnum = pgEnum("temp_message_content_type", [
  "TEXT",
  "VOICE",
]);

/**
 * Временные сообщения для неидентифицированных пользователей
 * Хранятся до момента идентификации по пин-коду
 * После идентификации переносятся в interview_messages
 */
export const tempInterviewMessage = pgTable(
  "temp_interview_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    chatId: varchar("chat_id", { length: 100 }).notNull(),
    content: text("content").notNull(),
    contentType: tempMessageContentTypeEnum("content_type")
      .default("TEXT")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    externalMessageId: varchar("external_message_id", { length: 100 }),
    sender: tempMessageSenderEnum("sender").notNull(),
    tempSessionId: varchar("temp_session_id", {
      length: 100,
    }).notNull(),
  },
  (table) => ({
    tempSessionIdx: index("temp_interview_message_session_idx").on(
      table.tempSessionId,
    ),
    chatIdx: index("temp_interview_message_chat_idx").on(table.chatId),
    createdAtIdx: index("temp_interview_message_created_at_idx").on(
      table.createdAt,
    ),
  }),
);

export const CreateTempInterviewMessageSchema = createInsertSchema(
  tempInterviewMessage,
  {
    tempSessionId: z.string().max(100),
    chatId: z.string().max(100),
    sender: z.enum(["CANDIDATE", "BOT"]),
    contentType: z.enum(["TEXT", "VOICE"]).default("TEXT"),
    content: z.string().transform((val) => val.replace(/\0/g, "")),
    externalMessageId: z.string().max(100).optional(),
  },
).omit({
  id: true,
  createdAt: true,
});
