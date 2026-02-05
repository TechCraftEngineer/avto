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
import {
  careerTrajectoryTypeEnum,
  recommendationEnum,
} from "../shared/response-enums";
import { response } from "./response";

/**
 * Результаты скрининга откликов
 * Содержит ВСЕ оценки и анализы кандидата
 */
export const responseScreening = pgTable(
  "response_screenings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    candidateSummary: text("candidate_summary"),
    careerTrajectoryAnalysis: text("career_trajectory_analysis"),
    careerTrajectoryScore: integer("career_trajectory_score"),
    careerTrajectoryType: careerTrajectoryTypeEnum("career_trajectory_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deliveryAnalysis: text("delivery_analysis"),
    deliveryScore: integer("delivery_score"),
    experienceAnalysis: text("experience_analysis"),
    experienceScore: integer("experience_score"),
    hiddenFitAnalysis: text("hidden_fit_analysis"),
    hiddenFitIndicators: jsonb("hidden_fit_indicators").$type<string[]>(),
    overallAnalysis: text("overall_analysis"),
    overallScore: integer("overall_score").notNull(),
    potentialAnalysis: text("potential_analysis"),
    potentialScore: integer("potential_score"),
    priceAnalysis: text("price_analysis"),
    priceScore: integer("price_score"),
    psychometricAnalysis: jsonb("psychometric_analysis").$type<{
      lifePathNumber: number;
      destinyNumber?: number | null;
      soulUrgeNumber?: number | null;
      compatibilityScore: number;
      roleCompatibility: { score: number; analysis: string };
      companyCompatibility: { score: number; analysis: string };
      teamCompatibility: { score: number; analysis: string };
      strengths: string[];
      challenges: string[];
      recommendations: string[];
      summary: string;
      favorablePeriods?: Array<{ period: string; description: string }>;
    }>(),
    psychometricScore: integer("psychometric_score"),
    rankingAnalysis: text("ranking_analysis"),
    rankingPosition: integer("ranking_position"),
    recommendation: recommendationEnum("recommendation"),
    responseId: uuid("response_id")
      .notNull()
      .unique()
      .references(() => response.id, { onDelete: "cascade" }),
    screenedAt: timestamp("screened_at", { withTimezone: true }),
    skillsAnalysis: text("skills_analysis"),
    skillsMatchScore: integer("skills_match_score"),
    strengths: jsonb("strengths").$type<string[]>(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    weaknesses: jsonb("weaknesses").$type<string[]>(),
  },
  (table) => [
    // Индексы для поиска
    index("response_screening_response_idx").on(table.responseId),

    // Индексы для сортировки по оценкам
    index("response_screening_overall_score_idx").on(table.overallScore),
    index("response_screening_skills_score_idx").on(table.skillsMatchScore),
    index("response_screening_experience_score_idx").on(table.experienceScore),
    index("response_screening_potential_score_idx").on(table.potentialScore),
    index("response_screening_career_trajectory_score_idx").on(
      table.careerTrajectoryScore,
    ),
    index("response_screening_psychometric_score_idx").on(
      table.psychometricScore,
    ),

    // Индексы для фильтрации
    index("response_screening_recommendation_idx").on(table.recommendation),
    index("response_screening_ranking_position_idx").on(table.rankingPosition),
    index("response_screening_career_trajectory_type_idx").on(
      table.careerTrajectoryType,
    ),

    // CHECK constraints для оценок (0-100)
    check(
      "response_screening_overall_score_check",
      sql`${table.overallScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_skills_score_check",
      sql`${table.skillsMatchScore} IS NULL OR ${table.skillsMatchScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_experience_score_check",
      sql`${table.experienceScore} IS NULL OR ${table.experienceScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_price_score_check",
      sql`${table.priceScore} IS NULL OR ${table.priceScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_delivery_score_check",
      sql`${table.deliveryScore} IS NULL OR ${table.deliveryScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_potential_score_check",
      sql`${table.potentialScore} IS NULL OR ${table.potentialScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_career_trajectory_score_check",
      sql`${table.careerTrajectoryScore} IS NULL OR ${table.careerTrajectoryScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_screening_psychometric_score_check",
      sql`${table.psychometricScore} IS NULL OR ${table.psychometricScore} BETWEEN 0 AND 100`,
    ),
  ],
);

export const CreateResponseScreeningSchema = createInsertSchema(
  responseScreening,
  {
    responseId: z.string().uuid(),
    overallScore: z.number().int().min(0).max(100),
    skillsMatchScore: z.number().int().min(0).max(100).optional(),
    experienceScore: z.number().int().min(0).max(100).optional(),
    priceScore: z.number().int().min(0).max(100).optional(),
    deliveryScore: z.number().int().min(0).max(100).optional(),
    potentialScore: z.number().int().min(0).max(100).optional(),
    careerTrajectoryScore: z.number().int().min(0).max(100).optional(),
    psychometricScore: z.number().int().min(0).max(100).optional(),
    careerTrajectoryType: z
      .enum(["growth", "stable", "decline", "jump", "role_change"])
      .optional(),
    recommendation: z
      .enum(["HIGHLY_RECOMMENDED", "RECOMMENDED", "NEUTRAL", "NOT_RECOMMENDED"])
      .optional(),
    rankingPosition: z.number().int().positive().optional(),
    hiddenFitIndicators: z.array(z.string()).optional(),
    strengths: z.array(z.string()).optional(),
    weaknesses: z.array(z.string()).optional(),
    overallAnalysis: z.string().optional(),
    skillsAnalysis: z.string().optional(),
    experienceAnalysis: z.string().optional(),
    priceAnalysis: z.string().optional(),
    deliveryAnalysis: z.string().optional(),
    potentialAnalysis: z.string().optional(),
    careerTrajectoryAnalysis: z.string().optional(),
    hiddenFitAnalysis: z.string().optional(),
    rankingAnalysis: z.string().optional(),
    candidateSummary: z.string().max(500).optional(),
    psychometricAnalysis: z
      .object({
        lifePathNumber: z.number(),
        destinyNumber: z.number().optional(),
        soulUrgeNumber: z.number().optional(),
        compatibilityScore: z.number(),
        roleCompatibility: z.object({
          score: z.number(),
          analysis: z.string(),
        }),
        companyCompatibility: z.object({
          score: z.number(),
          analysis: z.string(),
        }),
        teamCompatibility: z.object({
          score: z.number(),
          analysis: z.string(),
        }),
        strengths: z.array(z.string()),
        challenges: z.array(z.string()),
        recommendations: z.array(z.string()),
        summary: z.string(),
        favorablePeriods: z
          .array(
            z.object({
              period: z.string(),
              description: z.string(),
            }),
          )
          .optional(),
      })
      .optional(),
    screenedAt: z.coerce.date().optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ResponseScreening = typeof responseScreening.$inferSelect;
export type NewResponseScreening = typeof responseScreening.$inferInsert;
