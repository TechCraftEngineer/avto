/**
 * Agent Feedback Schema
 *
 * Хранит обратную связь от рекрутеров на рекомендации AI-агента.
 * Используется для:
 * - Отслеживания принятых/отклонённых рекомендаций
 * - Расчёта метрик качества
 * - Влияния на будущие рекомендации
 *
 * Requirements: 10.1, 10.2, 10.4
 */

import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

import { user } from "../auth";
import { workspace } from "../workspace/workspace";

/**
 * Тип обратной связи
 */
export const feedbackTypeEnum = pgEnum("agent_feedback_type", [
  "accepted",
  "rejected",
  "modified",
  "error_report",
]);

/**
 * Таблица обратной связи от рекрутеров
 */
export const agentFeedback = pgTable(
  "agent_feedback",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    actionId: uuid("action_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    feedbackType: feedbackTypeEnum("feedback_type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    originalRecommendation: text("original_recommendation"),
    rating: integer("rating"),
    reason: text("reason"),
    recommendationId: uuid("recommendation_id"),
    userAction: text("user_action"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => [
    // Индекс по workspace для tenant isolation
    index("agent_feedback_workspace_idx").on(table.workspaceId),

    // Индекс по пользователю
    index("agent_feedback_user_idx").on(table.userId),

    // Индекс по типу feedback
    index("agent_feedback_type_idx").on(table.feedbackType),

    // Composite индекс для поиска по workspace и времени
    index("agent_feedback_workspace_created_at_idx").on(
      table.workspaceId,
      table.createdAt,
    ),

    // Composite индекс для поиска по пользователю и workspace
    index("agent_feedback_user_workspace_idx").on(
      table.userId,
      table.workspaceId,
    ),

    // CHECK constraint для rating
    check(
      "agent_feedback_rating_check",
      sql`${table.rating} IS NULL OR ${table.rating} BETWEEN 1 AND 5`,
    ),
  ],
);

/**
 * Zod схемы для валидации
 */
export const InsertAgentFeedbackSchema = createInsertSchema(agentFeedback, {
  rating: (schema) => schema.min(1).max(5).optional(),
  reason: (schema) => schema.max(1000).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const SelectAgentFeedbackSchema = createSelectSchema(agentFeedback);

/**
 * TypeScript типы
 */
export type AgentFeedback = typeof agentFeedback.$inferSelect;
export type NewAgentFeedback = typeof agentFeedback.$inferInsert;
export type InsertAgentFeedback = z.infer<typeof InsertAgentFeedbackSchema>;
