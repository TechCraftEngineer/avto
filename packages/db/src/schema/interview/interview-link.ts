import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Тип сущности для ссылок на интервью
 */
export const interviewLinkEntityTypeEnum = pgEnum(
  "interview_link_entity_type",
  ["gig", "vacancy", "project", "response"],
);

/**
 * Ссылки на интервью для сущностей
 * Позволяет создавать уникальные ссылки для прохождения интервью
 */
export const interviewLink = pgTable(
  "interview_links",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь с сущностью
    entityType: interviewLinkEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(), // ID сущности (UUID или кастомный ID)

    // Токен ссылки (уникальный идентификатор для URL)
    token: varchar("token", { length: 100 }).notNull().unique(),

    // Активна ли ссылка
    isActive: boolean("is_active").default(true).notNull(),

    // Дата истечения (опционально)
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Уникальность: одна активная ссылка на сущность
    unique("interview_link_entity_unique").on(table.entityType, table.entityId),
    index("interview_link_entity_idx").on(table.entityType, table.entityId),
    index("interview_link_token_idx").on(table.token),
    index("interview_link_active_idx").on(table.isActive),
    index("interview_link_expires_idx").on(table.expiresAt),
  ],
);

export const CreateInterviewLinkSchema = createInsertSchema(interviewLink, {
  entityType: z.enum(["gig", "vacancy", "project", "response"]),
  entityId: z.string(), // Может быть UUID или кастомный ID
  token: z.string().max(100),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InterviewLink = typeof interviewLink.$inferSelect;
export type NewInterviewLink = typeof interviewLink.$inferInsert;
export type InterviewLinkEntityType =
  (typeof interviewLinkEntityTypeEnum.enumValues)[number];
