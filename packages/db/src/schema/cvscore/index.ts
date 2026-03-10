import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Результаты AI-скрининга из приложения cvscore.
 * Отдельная таблица для хранения бесплатных скринингов (lead generation).
 */
export const cvscoreScreeningResult = pgTable("cvscore_screening_results", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

  /** Текст резюме (обрезка до 15k при сохранении) */
  resumeText: text("resume_text").notNull(),

  /** Текст вакансии (обрезка до 5k при сохранении) */
  vacancyText: text("vacancy_text").notNull(),

  /** Оценка 0–100 */
  score: integer("score").notNull(),

  /** Сильные стороны */
  strengths: jsonb("strengths").$type<string[]>().notNull(),

  /** Риски */
  risks: jsonb("risks").$type<string[]>().notNull(),

  /** Вопросы для интервью */
  interviewQuestions: jsonb("interview_questions").$type<string[]>().notNull(),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});
