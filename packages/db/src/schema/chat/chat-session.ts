import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Тип сущности для командных чатов
 * НЕ включает интервью - для них есть interviewSession
 */
export const chatEntityTypeEnum = pgEnum("chat_entity_type", [
  "gig", // Чат по гигу (заказчик-исполнитель)
  "vacancy", // Чат команды по вакансии
  "project", // Общий чат проекта
  "team", // Чат команды
]);

export const chatStatusEnum = pgEnum("chat_status", [
  "active",
  "archived",
  "blocked",
]);

/**
 * Командные чаты (НЕ интервью)
 * Для общения команды по вакансиям, гигам, проектам
 * Также используется для персональных AI-чатов по сущностям
 */
export const chatSession = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    entityId: text("entity_id").notNull(),
    entityType: chatEntityTypeEnum("entity_type").notNull(),
    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
      mode: "date",
    }),
    messageCount: integer("message_count").default(0).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    status: chatStatusEnum("status").default("active").notNull(),
    title: varchar("title", { length: 500 }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id"),
  },
  (table) => ({
    entityTypeIdx: index("chat_session_entity_type_idx").on(table.entityType),
    entityIdx: index("chat_session_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    userIdx: index("chat_session_user_idx").on(table.userId),
    entityUserIdx: index("chat_session_entity_user_idx").on(
      table.entityType,
      table.entityId,
      table.userId,
    ),
    statusIdx: index("chat_session_status_idx").on(table.status),
    lastMessageAtIdx: index("chat_session_last_message_at_idx").on(
      table.lastMessageAt,
    ),
    metadataIdx: index("chat_session_metadata_idx").using(
      "gin",
      table.metadata,
    ),
    // UNIQUE constraint to prevent race condition duplicates
    uniqueEntityUser: unique("chat_session_entity_user_unique").on(
      table.entityType,
      table.entityId,
      table.userId,
    ),
  }),
);

export type ChatSession = typeof chatSession.$inferSelect;
export type NewChatSession = typeof chatSession.$inferInsert;
export type ChatEntityType = (typeof chatEntityTypeEnum.enumValues)[number];
