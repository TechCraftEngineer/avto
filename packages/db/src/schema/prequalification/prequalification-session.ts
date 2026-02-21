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
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { chatSession } from "../chat/chat-session";
import { interviewSession } from "../interview/interview-session";
import { response } from "../response/response";
import { vacancy } from "../vacancy/vacancy";
import { workspace } from "../workspace/workspace";

// Types for parsed resume data
export interface ParsedResumePersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  /** "male" | "female" | "other" (извлекается AI-парсером резюме) */
  gender?: string;
  /** Гражданство (извлекается AI-парсером резюме) */
  citizenship?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
}

export interface Education {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface StructuredResume {
  personalInfo: ParsedResumePersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: Language[];
  summary?: string;
}

export interface ParsedResume {
  rawText: string;
  structured: StructuredResume;
  confidence: number;
}

// Types for evaluation results
export interface DimensionScore {
  score: number; // 0-100
  confidence: number; // 0-1
  notes: string;
}

export interface EvaluationResult {
  fitScore: number; // 0-100
  fitDecision: "strong_fit" | "potential_fit" | "not_fit";
  dimensions: {
    hardSkills: DimensionScore;
    softSkills: DimensionScore;
    cultureFit: DimensionScore;
    salaryAlignment: DimensionScore;
  };
  strengths: string[];
  risks: string[];
  recommendation: string;
  aiSummary: string;
}

// Enums
export const prequalificationStatusEnum = pgEnum("prequalification_status", [
  "consent_pending",
  "resume_pending",
  "dialogue_active",
  "evaluating",
  "completed",
  "submitted",
  "expired",
]);

export const prequalificationSourceEnum = pgEnum("prequalification_source", [
  "widget",
  "direct",
]);

export const fitDecisionEnum = pgEnum("fit_decision", [
  "strong_fit",
  "potential_fit",
  "not_fit",
]);

// Prequalification Session Table
export const prequalificationSession = pgTable(
  "prequalification_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Workspace к которому принадлежит сессия
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    // Вакансия для которой проводится преквалификация
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancy.id, { onDelete: "cascade" }),

    // Связь с откликом (создаётся после успешной преквалификации)
    responseId: uuid("response_id").references(() => response.id, {
      onDelete: "set null",
    }),

    // Связь с чат-сессией (для внутренних обсуждений)
    chatSessionId: uuid("chat_session_id").references(() => chatSession.id, {
      onDelete: "set null",
    }),

    // Связь с интервью-сессией (для диалога с кандидатом)
    interviewSessionId: uuid("interview_session_id").references(
      () => interviewSession.id,
      {
        onDelete: "set null",
      },
    ),

    // Статус сессии
    status: prequalificationStatusEnum("status")
      .default("consent_pending")
      .notNull(),

    // Источник сессии
    source: prequalificationSourceEnum("source").default("widget").notNull(),

    // Распарсенное резюме
    parsedResume: jsonb("parsed_resume").$type<ParsedResume>(),

    // Результаты оценки
    fitScore: integer("fit_score"),
    fitDecision: fitDecisionEnum("fit_decision"),
    evaluation: jsonb("evaluation").$type<EvaluationResult>(),

    // Обратная связь для кандидата
    candidateFeedback: text("candidate_feedback"),

    // Отслеживание согласия
    consentGivenAt: timestamp("consent_given_at", {
      withTimezone: true,
      mode: "date",
    }),

    // Метаданные сессии
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),

    // Время истечения сессии
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("preq_session_workspace_idx").on(table.workspaceId),
    index("preq_session_vacancy_idx").on(table.vacancyId),
    index("preq_session_response_idx").on(table.responseId),
    index("preq_session_status_idx").on(table.status),
    index("preq_session_fit_score_idx").on(table.fitScore),
    index("preq_session_chat_idx").on(table.chatSessionId),
    index("preq_session_interview_idx").on(table.interviewSessionId),
    index("preq_session_parsed_resume_idx").using("gin", table.parsedResume),
    index("preq_session_evaluation_idx").using("gin", table.evaluation),
    check(
      "preq_session_fit_score_check",
      sql`${table.fitScore} IS NULL OR ${table.fitScore} BETWEEN 0 AND 100`,
    ),
  ],
);

// Zod schemas
export const CreatePrequalificationSessionSchema = createInsertSchema(
  prequalificationSession,
  {
    workspaceId: z.string().min(1),
    vacancyId: z.string().uuid(),
    status: z
      .enum(prequalificationStatusEnum.enumValues)
      .default("consent_pending"),
    source: z.enum(prequalificationSourceEnum.enumValues).default("widget"),
    ipAddress: z.string().max(45).optional(),
    userAgent: z.string().optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type PrequalificationSession =
  typeof prequalificationSession.$inferSelect;
export type NewPrequalificationSession =
  typeof prequalificationSession.$inferInsert;
export type PrequalificationStatus =
  (typeof prequalificationStatusEnum.enumValues)[number];
export type PrequalificationSource =
  (typeof prequalificationSourceEnum.enumValues)[number];
/** Реэкспорт для обратной совместимости */
export type { FitDecision } from "@qbs-autonaim/types";
