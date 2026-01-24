import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { response } from "../response/response";

/**
 * Тип сущности для ссылок на веб-чат
 */
export const webChatLinkEntityTypeEnum = pgEnum(
  "web_chat_link_entity_type",
  ["gig", "vacancy", "project"],
);

/**
 * Ссылок на веб-чат для сущностей и откликов
 * Позволяет создавать уникальные ссылки для прохождения веб-чата
 * Поддерживает два сценария:
 * 1. Связанные с конкретным откликом (responseId) - для известных кандидатов
 * 2. Универсальные (только entityType + entityId) - для неизвестных кандидатов
 */
export const webChatLink = pgTable(
  "web_chat_links",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь с сущностью (обязательна)
    entityType: webChatLinkEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    // Связь с откликом (опционально - для известных кандидатов)
    responseId: uuid("response_id").references(() => response.id, {
      onDelete: "cascade",
    }),

    // Токен ссылки (уникальный идентификатор для URL)
    token: varchar("token", { length: 100 }).notNull().unique(),

    // Активна ли ссылка
    isActive: boolean("is_active").default(true).notNull(),

    // Дата истечения (опционально)
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),

    // Метаданные
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Уникальность для связанных с откликом ссылок
    unique("web_chat_link_response_unique").on(table.responseId),
    // Уникальность для универсальных ссылок на сущность
    unique("web_chat_link_entity_unique").on(
      table.entityType,
      table.entityId,
    ),
    // Индексы
    index("web_chat_link_entity_idx").on(table.entityType, table.entityId),
    index("web_chat_link_response_idx").on(table.responseId),
    index("web_chat_link_token_idx").on(table.token),
    index("web_chat_link_active_idx").on(table.isActive),
    index("web_chat_link_expires_idx").on(table.expiresAt),
    index("web_chat_link_metadata_idx").using("gin", table.metadata),
  ],
);

export const CreateWebChatLinkSchema = createInsertSchema(webChatLink, {
  entityType: z.enum(["gig", "vacancy", "project"]),
  entityId: z.string().uuid(),
  responseId: z.string().uuid().optional(),
  token: z.string().max(100),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WebChatLink = typeof webChatLink.$inferSelect;
export type NewWebChatLink = typeof webChatLink.$inferInsert;
export type WebChatLinkEntityType =
  (typeof webChatLinkEntityTypeEnum.enumValues)[number];
