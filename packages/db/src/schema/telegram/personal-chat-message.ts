/**
 * Сообщения в ручных чатах через личный Telegram.
 * Отдельно от interview_messages — только логирование, без AI-анализа.
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { file } from "../file/file";
import { personalChatSession } from "./personal-chat-session";

export const personalChatMessageRoleEnum = pgEnum(
  "personal_chat_message_role",
  [
    "user", // Рекрутер (владелец личного аккаунта)
    "candidate", // Кандидат
  ],
);

export const personalChatMessageTypeEnum = pgEnum(
  "personal_chat_message_type",
  ["text", "voice"],
);

export const personalChatMessage = pgTable(
  "personal_chat_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    content: text("content"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    externalId: varchar("external_id", { length: 100 }),
    fileId: uuid("file_id").references(() => file.id, { onDelete: "set null" }),
    role: personalChatMessageRoleEnum("role").notNull(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => personalChatSession.id, { onDelete: "cascade" }),
    type: personalChatMessageTypeEnum("type").default("text").notNull(),
    voiceDuration: integer("voice_duration"),
    voiceTranscription: text("voice_transcription"),
  },
  (table) => ({
    sessionIdx: index("personal_chat_message_session_idx").on(table.sessionId),
    createdAtIdx: index("personal_chat_message_created_at_idx").on(
      table.createdAt,
    ),
  }),
);

export type PersonalChatMessage = typeof personalChatMessage.$inferSelect;
export type NewPersonalChatMessage = typeof personalChatMessage.$inferInsert;
