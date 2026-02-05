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
import { file } from "../file/file";
import { chatSession } from "./chat-session";

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user", // Участник команды
  "assistant", // AI ассистент
  "admin", // Админ/рекрутер
  "system", // Системные сообщения
]);

export const chatMessageTypeEnum = pgEnum("chat_message_type", [
  "text",
  "file",
  "event", // Системные события
]);

export interface ChatMessageMetadata {
  isRead?: boolean;
  editedAt?: string;
  latencyMs?: number;
  entitiesMentioned?: string[];
  [key: string]: unknown;
}

/**
 * Сообщения в командных чатах
 */
export const chatMessage = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    content: text("content"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    fileId: uuid("file_id").references(() => file.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<ChatMessageMetadata>(),
    quickReplies: jsonb("quick_replies").$type<string[]>(),
    role: chatMessageRoleEnum("role").notNull(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSession.id, { onDelete: "cascade" }),
    type: chatMessageTypeEnum("type").default("text").notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => ({
    sessionIdx: index("chat_message_session_idx").on(table.sessionId),
    sessionCreatedIdx: index("chat_message_session_created_idx").on(
      table.sessionId,
      table.createdAt,
    ),
    userIdx: index("chat_message_user_idx").on(table.userId),
    roleIdx: index("chat_message_role_idx").on(table.role),
    typeIdx: index("chat_message_type_idx").on(table.type),
    metadataIdx: index("chat_message_metadata_idx").using(
      "gin",
      table.metadata,
    ),
    quickRepliesIdx: index("chat_message_quick_replies_idx").using(
      "gin",
      table.quickReplies,
    ),
  }),
);

export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
