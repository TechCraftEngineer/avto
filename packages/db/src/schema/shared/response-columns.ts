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
  birthDate: timestamp("birth_date", { withTimezone: true, mode: "date" }),
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
  candidateSummary: text("candidate_summary"), // Краткое резюме для финалистов
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

/**
 * Эмоциональный анализ
 */
export const emotionalAnalysisColumns = {
  emotionalTone: jsonb("emotional_tone").$type<{
    enthusiasm: number; // 0-100
    confidence: number; // 0-100
    stressLevel: number; // 0-100
    authenticity: number; // 0-100
  }>(),
  sentimentAnalysis: jsonb("sentiment_analysis").$type<{
    overall: "positive" | "neutral" | "negative";
    scores: { positive: number; negative: number; neutral: number };
  }>(),
};

/**
 * Карьерная стабильность
 */
export const careerStabilityColumns = {
  careerStability: jsonb("career_stability").$type<{
    jobTenure: number; // средняя продолжительность работы (месяцы)
    growthRate: number; // скорость роста зарплаты/позиций
    riskFactors: string[]; // факторы риска (частые увольнения и т.д.)
    stabilityScore: number; // 0-100
  }>(),
};

/**
 * Предиктивные метрики
 */
export const predictiveMetricsColumns = {
  predictiveMetrics: jsonb("predictive_metrics").$type<{
    retentionProbability: number; // вероятность удержания (0-100)
    performanceScore: number; // предсказанная производительность (0-100)
    culturalFitScore: number; // соответствие культуре (0-100)
    growthPotential: number; // потенциал роста (0-100)
  }>(),
};

/**
 * Поведенческий анализ
 */
export const behavioralAnalysisColumns = {
  behavioralPatterns: jsonb("behavioral_patterns").$type<{
    responseTimePattern: {
      averageResponseTime: number; // среднее время ответа (сек)
      consistency: number; // consistency в скорости (0-100)
      aiSuspicionLevel: number; // уровень подозрения AI (0-100)
    };
    engagementMetrics: {
      messageCount: number;
      questionDepth: number; // глубина вопросов
      followUpRate: number; // процент follow-up вопросов
    };
    communicationStyle: {
      formality: number; // формальность (0-100)
      clarity: number; // ясность (0-100)
      persuasiveness: number; // убедительность (0-100)
    };
  }>(),
};

/**
 * DEI метрики
 */
export const deiMetricsColumns = {
  deiMetrics: jsonb("dei_metrics").$type<{
    consentGiven: boolean; // Явное согласие кандидата на обработку данных
    consentTimestamp: string; // Время предоставления согласия
    purpose: string; // Цель обработки данных
    diversity: {
      geography: string; // География оставлена как нечувствительная информация
    };
    biasDetection: {
      detectedBiases: string[]; // выявленные biases
      fairnessScore: number; // оценка fairness (0-100)
      recommendations: string[]; // рекомендации по улучшению
    };
  }>(),
};

/**
 * Внешние источники
 */
export const externalSourcesColumns = {
  linkedInData: jsonb("linkedin_data").$type<{
    profileUrl: string;
    connections: number;
    endorsements: Array<{
      skill: string;
      count: number;
    }>;
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
    }>;
    recommendations: Array<{
      author: string;
      text: string;
      date?: string;
    }>;
  }>(),
  githubData: jsonb("github_data").$type<{
    profileUrl: string;
    repositories: Array<{
      name: string;
      url: string;
      description?: string;
      stars: number;
      forks: number;
    }>;
    contributions: number;
    languages: Array<{
      name: string;
      percentage: number;
    }>;
    activity: Array<{
      type: string;
      date: string;
      description?: string;
    }>;
  }>(),
  portfolioAnalysis: jsonb("portfolio_analysis").$type<{
    quality: number; // качество работ (0-100)
    relevance: number; // релевантность (0-100)
    technicalSkills: string[]; // выявленные навыки
    creativity: number; // креативность (0-100)
  }>(),
};
