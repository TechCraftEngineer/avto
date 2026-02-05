import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { response } from "../response/response";

/**
 * Статус интервью
 */
export const interviewStatusEnum = pgEnum("interview_status", [
  "pending", // Ожидает начала
  "active", // В процессе
  "completed", // Завершено
  "cancelled", // Отменено
  "paused", // Приостановлено (кандидат попросил перенести)
]);

/**
 * Канал коммуникации
 */
export const interviewChannelEnum = pgEnum("interview_channel", [
  "web",
  "telegram",
  "whatsapp",
  "max", // Будущий мессенджер
]);

/**
 * Метаданные интервью-сессии
 */
export interface InterviewSessionMetadata {
  /** Ответы на вопросы интервью */
  questionAnswers?: Array<{
    question: string;
    answer: string;
    timestamp?: string;
  }>;
  /** Telegram username кандидата */
  telegramUsername?: string;
  /** Telegram chat ID */
  telegramChatId?: string;
  /** Причина паузы/отмены */
  pauseReason?: string;
  /** Дополнительные данные */
  [key: string]: unknown;
}

/**
 * Сессия интервью с AI-ботом
 * Связана с универсальной таблицей responses
 */
export const interviewSession = pgTable(
  "interview_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    lastChannel: interviewChannelEnum("last_channel"),
    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
      mode: "date",
    }),
    messageCount: integer("message_count").default(0).notNull(),
    metadata: jsonb("metadata").$type<InterviewSessionMetadata>(),
    questionNumber: integer("question_number").default(0).notNull(),
    responseId: uuid("response_id")
      .notNull()
      .unique()
      .references(() => response.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    status: interviewStatusEnum("status").default("pending").notNull(),
    totalQuestions: integer("total_questions"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("interview_session_response_idx").on(table.responseId),
    index("interview_session_status_idx").on(table.status),
    index("interview_session_last_channel_idx").on(table.lastChannel),
    index("interview_session_metadata_idx").using("gin", table.metadata),
    index("interview_session_last_message_at_idx").on(table.lastMessageAt),
    index("interview_session_status_last_message_idx").on(
      table.status,
      table.lastMessageAt,
    ),
  ],
);

export type InterviewSession = typeof interviewSession.$inferSelect;
export type NewInterviewSession = typeof interviewSession.$inferInsert;
export type InterviewStatus = (typeof interviewStatusEnum.enumValues)[number];
export type InterviewChannel = (typeof interviewChannelEnum.enumValues)[number];
