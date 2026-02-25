/**
 * Сессия ручного чата пользователя с кандидатом через личный Telegram.
 * Связывает userId, кандидата (globalCandidate) и Telegram chatId.
 * Полностью изолирована от interview_sessions (автоматические интервью).
 */

import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { globalCandidate } from "../candidate/global-candidate";

export const personalChatSession = pgTable(
  "personal_chat_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    globalCandidateId: uuid("global_candidate_id")
      .notNull()
      .references(() => globalCandidate.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
      mode: "date",
    }),
    metadata: jsonb("metadata").$type<{
      candidateName?: string;
      telegramUsername?: string;
      [key: string]: unknown;
    }>(),
    telegramChatId: varchar("telegram_chat_id", { length: 100 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userCandidateIdx: index("personal_chat_session_user_candidate_idx").on(
      table.userId,
      table.globalCandidateId,
    ),
    userChatIdx: index("personal_chat_session_user_chat_idx").on(
      table.userId,
      table.telegramChatId,
    ),
    chatIdx: index("personal_chat_session_chat_idx").on(table.telegramChatId),
  }),
);

export type PersonalChatSession = typeof personalChatSession.$inferSelect;
export type NewPersonalChatSession = typeof personalChatSession.$inferInsert;
