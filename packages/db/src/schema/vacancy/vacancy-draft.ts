import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "../auth/user";

// Интерфейс для данных черновика (хранится в JSONB)
export interface DraftData {
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string; // ISO string для сериализации
  }>;
  vacancyData: {
    title?: string;
    description?: string;
    requirements?: string[];
    conditions?: string[];
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
    };
  };
  currentStep: string;
}

export const vacancyDraft = pgTable(
  "vacancy_drafts",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Пользователь, которому принадлежит черновик
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Данные черновика в формате JSONB
    draftData: jsonb("draft_data").notNull().$type<DraftData>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Индекс для быстрого поиска по userId
    userIdIdx: index("vacancy_draft_user_id_idx").on(table.userId),
    // Индекс для поиска устаревших черновиков
    updatedAtIdx: index("vacancy_draft_updated_at_idx").on(table.updatedAt),
    // GIN индекс для поиска по содержимому JSONB
    draftDataIdx: index("vacancy_draft_data_idx").using("gin", table.draftData),
  }),
);

// Схемы для валидации
export const InsertVacancyDraftSchema = createInsertSchema(vacancyDraft, {
  userId: z.string().min(1),
  draftData: z.object({
    conversationHistory: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        timestamp: z.string(),
      }),
    ),
    vacancyData: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      requirements: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      salary: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
          currency: z.string().optional(),
        })
        .optional(),
    }),
    currentStep: z.string(),
  }),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const SelectVacancyDraftSchema = createSelectSchema(vacancyDraft);

export type VacancyDraft = typeof vacancyDraft.$inferSelect;
export type NewVacancyDraft = typeof vacancyDraft.$inferInsert;
