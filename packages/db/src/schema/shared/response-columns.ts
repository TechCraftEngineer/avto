import {
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { file } from "../file";
import type { StoredProfileData } from "../types";
import {
  hrSelectionStatusEnum,
  importSourceEnum,
  recommendationEnum,
  responseStatusEnum,
} from "./response-enums";

/**
 * Базовые колонки для идентификации кандидата
 * Используются в gig_responses и vacancy_responses
 */
export const candidateIdentityColumns = {
  candidateName: varchar("candidate_name", { length: 500 }),
  profileUrl: text("profile_url"),
};

/**
 * Контактные данные кандидата
 */
export const candidateContactColumns = {
  telegramUsername: varchar("telegram_username", { length: 100 }),
  chatId: varchar("chat_id", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  contacts: jsonb("contacts").$type<Record<string, unknown>>(),
  resumeLanguage: varchar("resume_language", { length: 10 }).default("ru"),
  telegramPinCode: varchar("telegram_pin_code", { length: 4 }),
};

/**
 * Файлы кандидата (фото, резюме)
 */
export const candidateFileColumns = {
  photoFileId: uuid("photo_file_id").references(() => file.id, {
    onDelete: "set null",
  }),
};

/**
 * Опыт и навыки кандидата
 */
export const candidateExperienceColumns = {
  experience: text("experience"),
  profileData: jsonb("profile_data").$type<StoredProfileData>(),
  skills: jsonb("skills").$type<string[]>(),
  rating: varchar("rating", { length: 20 }),
};

/**
 * Статусы отклика
 */
export const responseStatusColumns = {
  status: responseStatusEnum("status").default("NEW").notNull(),
  hrSelectionStatus: hrSelectionStatusEnum("hr_selection_status"),
  importSource: importSourceEnum("import_source").default("MANUAL"),
};

/**
 * Ranking scores (0-100)
 */
export const rankingScoreColumns = {
  compositeScore: integer("composite_score"),
  priceScore: integer("price_score"),
  deliveryScore: integer("delivery_score"),
  skillsMatchScore: integer("skills_match_score"),
  experienceScore: integer("experience_score"),
};

/**
 * Reasoning for ranking scores (explainable AI)
 * Объяснения оценок для прозрачности решений AI
 */
export const rankingReasoningColumns = {
  priceScoreReasoning: text("price_score_reasoning"),
  deliveryScoreReasoning: text("delivery_score_reasoning"),
  skillsMatchScoreReasoning: text("skills_match_score_reasoning"),
  experienceScoreReasoning: text("experience_score_reasoning"),
  compositeScoreReasoning: text("composite_score_reasoning"),
  // Для вакансий: структурированные объяснения по dimensions
  evaluationReasoning: jsonb("evaluation_reasoning").$type<{
    hardSkills?: { score: number; notes: string };
    softSkills?: { score: number; notes: string };
    cultureFit?: { score: number; notes: string };
    salaryAlignment?: { score: number; notes: string };
  }>(),
};

/**
 * Ranking position and analysis
 */
export const rankingAnalysisColumns = {
  rankingPosition: integer("ranking_position"),
  rankingAnalysis: text("ranking_analysis"),
  candidateSummary: text("candidate_summary"), // Краткое резюме для шортлиста
  strengths: jsonb("strengths").$type<string[]>(),
  weaknesses: jsonb("weaknesses").$type<string[]>(),
  recommendation: recommendationEnum("recommendation"),
  rankedAt: timestamp("ranked_at", { withTimezone: true, mode: "date" }),
};

/**
 * Временные метки отклика
 */
export const responseTimestampColumns = {
  respondedAt: timestamp("responded_at", { withTimezone: true, mode: "date" }),
  welcomeSentAt: timestamp("welcome_sent_at", {
    withTimezone: true,
    mode: "date",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

/**
 * Сопроводительное письмо
 */
export const coverLetterColumn = {
  coverLetter: text("cover_letter"),
};
