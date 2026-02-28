import type { FitDecision as FitDecisionType } from "@qbs-autonaim/types";
import { z } from "zod";

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Hex color validation (e.g., #3B82F6)
 */
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: "Неверный формат цвета (ожидается #RRGGBB)",
});

/**
 * URL validation with optional null
 */
const optionalUrlSchema = z.url({ error: "Неверный формат URL" }).nullish();

/**
 * Session status enum
 */
export const sessionStatusSchema = z.enum([
  "consent_pending",
  "resume_pending",
  "dialogue_active",
  "evaluating",
  "completed",
  "submitted",
  "expired",
]);

export type SessionStatus = z.infer<typeof sessionStatusSchema>;

/**
 * Fit decision enum — значения из @qbs-autonaim/types
 */
export const fitDecisionSchema = z.enum([
  "strong_fit",
  "potential_fit",
  "not_fit",
]) satisfies z.ZodType<FitDecisionType>;

/** Реэкспорт из @qbs-autonaim/types */
export type FitDecision = FitDecisionType;

/**
 * Prequalification source enum
 */
export const prequalificationSourceSchema = z.enum(["widget", "direct"]);

export type PrequalificationSource = z.infer<
  typeof prequalificationSourceSchema
>;

/**
 * Widget tone enum
 */
export const widgetToneSchema = z.enum(["formal", "friendly"]);

export type WidgetTone = z.infer<typeof widgetToneSchema>;

/**
 * Honesty level enum
 */
export const honestyLevelSchema = z.enum([
  "direct",
  "diplomatic",
  "encouraging",
]);

export type HonestyLevel = z.infer<typeof honestyLevelSchema>;

/**
 * SSL status enum
 */
export const sslStatusSchema = z.enum([
  "pending",
  "active",
  "expired",
  "error",
]);

export type SSLStatus = z.infer<typeof sslStatusSchema>;

/**
 * File type enum for resume upload
 */
export const resumeFileTypeSchema = z.enum(["pdf", "docx"]);

export type ResumeFileType = z.infer<typeof resumeFileTypeSchema>;

// ============================================================================
// Session Schemas
// ============================================================================

/**
 * Create session input validation
 */
export const createSessionInputSchema = z.object({
  workspaceId: z.string().min(1, { message: "ID workspace обязателен" }),
  vacancyId: z.uuid({ error: "Неверный формат ID вакансии" }),
  candidateConsent: z.boolean().refine((val) => val === true, {
    message: "Необходимо согласие на обработку данных",
  }),
  source: prequalificationSourceSchema.default("widget"),
  userAgent: z.string().max(500).optional(),
  ipAddress: z.string().max(45).optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionInputSchema>;

/**
 * Get session input validation
 */
export const getSessionInputSchema = z.object({
  sessionId: z.uuid({ error: "Неверный формат ID сессии" }),
});

export type GetSessionInput = z.infer<typeof getSessionInputSchema>;

// ============================================================================
// Resume Upload Schemas
// ============================================================================

/**
 * Upload resume input validation
 */
export const uploadResumeInputSchema = z.object({
  sessionId: z.uuid({ error: "Неверный формат ID сессии" }),
  fileType: resumeFileTypeSchema,
  filename: z
    .string()
    .max(255, { message: "Имя файла не должно превышать 255 символов" })
    .optional(),
});

export type UploadResumeInput = z.infer<typeof uploadResumeInputSchema>;

// ============================================================================
// Message Schemas
// ============================================================================

/**
 * Send message input validation
 */
export const sendMessageInputSchema = z.object({
  sessionId: z.uuid({ error: "Неверный формат ID сессии" }),
  message: z
    .string()
    .min(1, { message: "Сообщение не может быть пустым" })
    .max(5000, { message: "Сообщение не должно превышать 5000 символов" }),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

// ============================================================================
// Result Schemas
// ============================================================================

/**
 * Get result input validation
 */
export const getResultInputSchema = z.object({
  sessionId: z.uuid({ error: "Неверный формат ID сессии" }),
});

export type GetResultInput = z.infer<typeof getResultInputSchema>;

/**
 * Submit application input validation
 */
export const submitApplicationInputSchema = z.object({
  sessionId: z.uuid({ error: "Неверный формат ID сессии" }),
});

export type SubmitApplicationInput = z.infer<
  typeof submitApplicationInputSchema
>;

// ============================================================================
// Widget Config Schemas
// ============================================================================

/**
 * Branding config validation
 */
export const brandingConfigSchema = z.object({
  logo: optionalUrlSchema,
  primaryColor: hexColorSchema.default("#3B82F6"),
  secondaryColor: hexColorSchema.default("#1E40AF"),
  backgroundColor: hexColorSchema.default("#FFFFFF"),
  textColor: hexColorSchema.default("#1F2937"),
  fontFamily: z
    .string()
    .min(1)
    .max(100, { message: "Название шрифта не должно превышать 100 символов" })
    .default("Inter"),
  assistantName: z
    .string()
    .min(1, { message: "Имя ассистента обязательно" })
    .max(100, { message: "Имя ассистента не должно превышать 100 символов" })
    .default("ИИ Ассистент"),
  assistantAvatar: optionalUrlSchema,
  welcomeMessage: z
    .string()
    .max(1000, {
      message: "Приветственное сообщение не должно превышать 1000 символов",
    })
    .nullish(),
  completionMessage: z
    .string()
    .max(1000, {
      message: "Сообщение завершения не должно превышать 1000 символов",
    })
    .nullish(),
});

export type BrandingConfig = z.infer<typeof brandingConfigSchema>;

/**
 * Behavior config validation
 */
export const behaviorConfigSchema = z.object({
  passThreshold: z
    .number()
    .int({ message: "Порог должен быть целым числом" })
    .min(0, { message: "Порог не может быть меньше 0" })
    .max(100, { message: "Порог не может быть больше 100" })
    .default(60),
  mandatoryQuestions: z
    .array(z.string().max(500))
    .max(20, { message: "Максимум 20 обязательных вопросов" })
    .default([]),
  tone: widgetToneSchema.default("friendly"),
  honestyLevel: honestyLevelSchema.default("diplomatic"),
  maxDialogueTurns: z
    .number()
    .int()
    .min(3, { message: "Минимум 3 сообщения в диалоге" })
    .max(50, { message: "Максимум 50 сообщений в диалоге" })
    .default(10),
  sessionTimeoutMinutes: z
    .number()
    .int()
    .min(5, { message: "Минимальный таймаут 5 минут" })
    .max(120, { message: "Максимальный таймаут 120 минут" })
    .default(30),
});

export type BehaviorConfig = z.infer<typeof behaviorConfigSchema>;

/**
 * Legal config validation
 */
export const legalConfigSchema = z.object({
  consentText: z
    .string()
    .max(5000, { message: "Текст согласия не должен превышать 5000 символов" })
    .nullish(),
  disclaimerText: z
    .string()
    .max(5000, {
      message: "Текст дисклеймера не должен превышать 5000 символов",
    })
    .nullish(),
  privacyPolicyUrl: optionalUrlSchema,
  dataRetentionDays: z
    .number()
    .int()
    .min(1, { message: "Минимальный срок хранения 1 день" })
    .max(365, { message: "Максимальный срок хранения 365 дней" })
    .default(90),
});

export type LegalConfig = z.infer<typeof legalConfigSchema>;

/**
 * Get widget config input validation
 */
export const getWidgetConfigInputSchema = z.object({
  workspaceId: z.string().min(1, { message: "ID workspace обязателен" }),
});

export type GetWidgetConfigInput = z.infer<typeof getWidgetConfigInputSchema>;

/**
 * Update widget config input validation (partial updates)
 */
export const updateWidgetConfigInputSchema = z.object({
  branding: brandingConfigSchema.partial().optional(),
  behavior: behaviorConfigSchema.partial().optional(),
  legal: legalConfigSchema.partial().optional(),
});

export type UpdateWidgetConfigInput = z.infer<
  typeof updateWidgetConfigInputSchema
>;

// ============================================================================
// Custom Domain Schemas
// ============================================================================

/**
 * Domain name validation
 * Supports subdomains and standard TLDs
 */
const domainNameSchema = z
  .string()
  .min(4, { message: "Домен слишком короткий" })
  .max(255, { message: "Домен слишком длинный" })
  .regex(/^(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/, {
    message: "Неверный формат домена",
  })
  .refine((domain) => !domain.startsWith("www."), {
    message: "Домен не должен начинаться с www.",
  });

/**
 * Register domain input validation
 */
export const registerDomainInputSchema = z.object({
  workspaceId: z.string().min(1, { message: "ID workspace обязателен" }),
  domain: domainNameSchema,
});

export type RegisterDomainInput = z.infer<typeof registerDomainInputSchema>;

/**
 * Shared domain ID schema for custom domain routes
 */
export const domainIdSchema = z.uuid({ error: "Неверный формат ID домена" });

/**
 * Verify domain input validation
 */
export const verifyDomainInputSchema = z.object({
  domainId: domainIdSchema,
});

export type VerifyDomainInput = z.infer<typeof verifyDomainInputSchema>;

/**
 * Get domain status input validation
 */
export const getDomainStatusInputSchema = z.object({
  domainId: domainIdSchema,
});

export type GetDomainStatusInput = z.infer<typeof getDomainStatusInputSchema>;

/**
 * Delete domain input validation
 */
export const deleteDomainInputSchema = z.object({
  domainId: domainIdSchema,
});

export type DeleteDomainInput = z.infer<typeof deleteDomainInputSchema>;

/**
 * Check domain availability input validation
 */
export const checkDomainAvailabilityInputSchema = z.object({
  domain: domainNameSchema,
});

export type CheckDomainAvailabilityInput = z.infer<
  typeof checkDomainAvailabilityInputSchema
>;

// ============================================================================
// Analytics Schemas
// ============================================================================

/**
 * Analytics event type enum
 */
export const analyticsEventTypeSchema = z.enum([
  "widget_view",
  "session_start",
  "resume_upload",
  "dialogue_message",
  "dialogue_complete",
  "evaluation_complete",
  "application_submit",
]);

export type AnalyticsEventType = z.infer<typeof analyticsEventTypeSchema>;

/**
 * Date range validation
 */
export const dateRangeSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((data) => data.from <= data.to, {
    message: "Дата начала должна быть раньше даты окончания",
  });

export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * Get dashboard input validation
 */
export const getDashboardInputSchema = z.object({
  workspaceId: z.string().min(1, { message: "ID workspace обязателен" }),
  period: dateRangeSchema.optional(),
});

export type GetDashboardInput = z.infer<typeof getDashboardInputSchema>;

/**
 * Get vacancy analytics input validation
 */
export const getVacancyAnalyticsInputSchema = z.object({
  vacancyId: z.uuid({ error: "Неверный формат ID вакансии" }),
  period: dateRangeSchema.optional(),
});

export type GetVacancyAnalyticsInput = z.infer<
  typeof getVacancyAnalyticsInputSchema
>;

/**
 * Export format enum
 */
export const exportFormatSchema = z.enum(["csv", "json"]);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

/**
 * Export data input validation
 */
export const exportDataInputSchema = z.object({
  workspaceId: z.string().min(1, { message: "ID workspace обязателен" }),
  format: exportFormatSchema.default("csv"),
  period: dateRangeSchema.optional(),
});

export type ExportDataInput = z.infer<typeof exportDataInputSchema>;

/**
 * Track event input validation
 */
export const trackEventInputSchema = z.object({
  workspaceId: z.string().min(1, { message: "ID workspace обязателен" }),
  vacancyId: z.uuid({ error: "Неверный формат ID вакансии" }).optional(),
  sessionId: z.uuid({ error: "Неверный формат ID сессии" }).optional(),
  eventType: analyticsEventTypeSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TrackEventInput = z.infer<typeof trackEventInputSchema>;

// ============================================================================
// Parsed Resume Schemas (for validation of AI output)
// ============================================================================

/**
 * Work experience validation
 */
export const workExperienceSchema = z.object({
  company: z.string().max(200),
  position: z.string().max(200),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().max(5000).optional(),
  isCurrent: z.boolean().default(false),
});

export type WorkExperience = z.infer<typeof workExperienceSchema>;

/**
 * Education validation
 */
export const educationSchema = z.object({
  institution: z.string().max(200),
  degree: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type Education = z.infer<typeof educationSchema>;

/**
 * Language validation
 */
export const languageSchema = z.object({
  name: z.string().max(50),
  level: z.string().max(50).optional(),
});

export type Language = z.infer<typeof languageSchema>;

import { phoneSchema } from "./phone";

/**
 * Personal info validation
 */
export const personalInfoSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.email().optional(),
  phone: phoneSchema,
  telegram: z.string().max(100).optional(),
  whatsapp: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  birthDate: z.string().optional(),
  /** "male", "female", "other" */
  gender: z.enum(["male", "female", "other"]).optional(),
  /** Гражданство (важно для оформления) */
  citizenship: z.string().max(100).optional(),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;

/**
 * Structured resume validation
 */
export const structuredResumeSchema = z.object({
  personalInfo: personalInfoSchema.optional(),
  experience: z.array(workExperienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(z.string().max(100)).default([]),
  languages: z.array(languageSchema).default([]),
  summary: z.string().max(5000).optional(),
});

export type StructuredResume = z.infer<typeof structuredResumeSchema>;

/**
 * Parsed resume validation
 */
export const parsedResumeSchema = z.object({
  rawText: z.string(),
  structured: structuredResumeSchema,
  confidence: z.number().min(0).max(1),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

// ============================================================================
// Evaluation Schemas (for validation of AI output)
// ============================================================================

/**
 * Dimension score validation — структура для prequalification (hardSkills, softSkills, …)
 */
export const dimensionScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  confidence: z.number().min(0).max(1),
  notes: z.string().max(1000),
});

export type DimensionScore = z.infer<typeof dimensionScoreSchema>;

/**
 * Evaluation result validation — структура для prequalification (dimensions object)
 */
export const evaluationResultSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
  fitDecision: fitDecisionSchema,
  dimensions: z.object({
    hardSkills: dimensionScoreSchema,
    softSkills: dimensionScoreSchema,
    cultureFit: dimensionScoreSchema,
    salaryAlignment: dimensionScoreSchema,
  }),
  strengths: z.array(z.string().max(500)).max(10),
  risks: z.array(z.string().max(500)).max(10),
  recommendation: z.string().max(2000),
  aiSummary: z.string().max(5000),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
