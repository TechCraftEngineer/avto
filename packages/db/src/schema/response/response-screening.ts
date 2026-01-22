import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { careerTrajectoryTypeEnum } from "../shared/response-enums";
import { response } from "./response";

/**
 * Результаты скрининга откликов
 */
export const responseScreening = pgTable(
  "response_screenings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    responseId: uuid("response_id")
      .notNull()
      .unique()
      .references(() => response.id, { onDelete: "cascade" }),

    // Оценки
    score: integer("score").notNull(), // 0-5
    detailedScore: integer("detailed_score").notNull(), // 0-100

    // Новые метрики оценки потенциала
    potentialScore: integer("potential_score"), // 0-100
    careerTrajectoryScore: integer("career_trajectory_score"), // 0-100
    careerTrajectoryType: careerTrajectoryTypeEnum("career_trajectory_type"),
    hiddenFitIndicators: jsonb("hidden_fit_indicators").$type<string[]>(),

    // Анализ
    analysis: text("analysis"),
    priceAnalysis: text("price_analysis"),
    deliveryAnalysis: text("delivery_analysis"),
    skillsAnalysis: text("skills_analysis"),
    experienceAnalysis: text("experience_analysis"),
    potentialAnalysis: text("potential_analysis"),
    careerTrajectoryAnalysis: text("career_trajectory_analysis"),
    hiddenFitAnalysis: text("hidden_fit_analysis"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("response_screening_response_idx").on(table.responseId),
    index("response_screening_score_idx").on(table.score),
    index("response_screening_detailed_score_idx").on(table.detailedScore),
    index("response_screening_potential_score_idx").on(table.potentialScore),
    index("response_screening_career_trajectory_score_idx").on(
      table.careerTrajectoryScore,
    ),
    index("response_screening_career_trajectory_type_idx").on(
      table.careerTrajectoryType,
    ),
    check(
      "response_screening_score_check",
      sql`${table.score} BETWEEN 0 AND 5`,
    ),
    check(
      "response_screening_detailed_score_check",
      sql`${table.detailedScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_potential_score_check",
      sql`${table.potentialScore} IS NULL OR ${table.potentialScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_career_trajectory_score_check",
      sql`${table.careerTrajectoryScore} IS NULL OR ${table.careerTrajectoryScore} BETWEEN 0 AND 100`,
    ),
  ],
);

export const CreateResponseScreeningSchema = createInsertSchema(
  responseScreening,
  {
    responseId: z.string().uuid(),
    score: z.number().int().min(0).max(5),
    detailedScore: z.number().int().min(0).max(100),
    potentialScore: z.number().int().min(0).max(100).optional(),
    careerTrajectoryScore: z.number().int().min(0).max(100).optional(),
    careerTrajectoryType: z
      .enum(["growth", "stable", "decline", "jump", "role_change"])
      .optional(),
    hiddenFitIndicators: z.array(z.string()).optional(),
    analysis: z.string().optional(),
    priceAnalysis: z.string().optional(),
    deliveryAnalysis: z.string().optional(),
    skillsAnalysis: z.string().optional(),
    experienceAnalysis: z.string().optional(),
    potentialAnalysis: z.string().optional(),
    careerTrajectoryAnalysis: z.string().optional(),
    hiddenFitAnalysis: z.string().optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ResponseScreening = typeof responseScreening.$inferSelect;
export type NewResponseScreening = typeof responseScreening.$inferInsert;
