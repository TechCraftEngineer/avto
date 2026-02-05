import { phoneSchema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { candidate } from "../candidate/candidate";
import { file } from "../file";
import {
  candidateContactColumns,
  candidateExperienceColumns,
  candidateFileColumns,
  candidateIdentityColumns,
  coverLetterColumn,
  responseStatusColumns,
  responseTimestampColumns,
} from "../shared/response-columns";
import {
  hrSelectionStatusValues,
  importSourceValues,
  responseStatusValues,
} from "../shared/response-enums";

/**
 * Тип сущности для откликов
 */
export const responseEntityTypeEnum = pgEnum("response_entity_type", [
  "gig",
  "vacancy",
  "project",
]);

/**
 * Универсальная таблица откликов
 * Объединяет vacancy_responses и gig_responses в единую полиморфную структуру
 */
export const response = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь с сущностью (gig, vacancy, project)
    entityType: responseEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    // Связь с глобальным профилем кандидата (Global Talent Pool)
    globalCandidateId: uuid("global_candidate_id").references(
      () => candidate.id,
      { onDelete: "set null" },
    ),

    // Идентификация кандидата на платформе
    candidateId: varchar("candidate_id", { length: 100 }).notNull(),
    ...candidateIdentityColumns,

    // Контакты
    ...candidateContactColumns,

    // === Gig-специфичные поля ===
    proposedPrice: integer("proposed_price"),
    proposedDeliveryDays: integer("proposed_delivery_days"),
    portfolioLinks: jsonb("portfolio_links").$type<string[]>(),
    portfolioFileId: uuid("portfolio_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

    // === Vacancy-специфичные поля ===
    resumeId: varchar("resume_id", { length: 100 }),
    resumeUrl: text("resume_url"),
    platformProfileUrl: text("platform_profile_url"),
    salaryExpectationsAmount: integer("salary_expectations_amount"),
    salaryExpectationsComment: varchar("salary_expectations_comment", {
      length: 200,
    }),

    // Сопроводительное письмо
    ...coverLetterColumn,

    // Файлы
    ...candidateFileColumns,
    resumePdfFileId: uuid("resume_pdf_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

    // Опыт и навыки
    ...candidateExperienceColumns,

    // Статусы
    ...responseStatusColumns,

    // Временные метки
    ...responseTimestampColumns,
  },
  (table) => [
    // Уникальность: один кандидат — один отклик на сущность
    unique("response_entity_candidate_unique").on(
      table.entityType,
      table.entityId,
      table.candidateId,
    ),
    // Основные индексы
    index("response_global_candidate_idx").on(table.globalCandidateId),
    index("response_status_idx").on(table.status),
    index("response_hr_status_idx").on(table.hrSelectionStatus),
    index("response_import_source_idx").on(table.importSource),
    // Composite индексы для частых запросов
    index("response_entity_status_idx").on(
      table.entityType,
      table.entityId,
      table.status,
    ),
    index("response_entity_hr_status_idx").on(
      table.entityType,
      table.entityId,
      table.hrSelectionStatus,
    ),
    // Поиск по кандидату
    index("response_candidate_idx").on(table.candidateId),
    index("response_profile_url_idx").on(table.profileUrl),
    index("response_platform_profile_idx").on(table.platformProfileUrl),
    // GIN индексы для JSONB
    index("response_skills_idx").using("gin", table.skills),
    index("response_profile_data_idx").using("gin", table.profileData),
    index("response_portfolio_links_idx").using("gin", table.portfolioLinks),
    index("response_contacts_idx").using("gin", table.contacts),
  ],
);

export const CreateResponseSchema = createInsertSchema(response, {
  entityType: z.enum(responseEntityTypeEnum.enumValues),
  entityId: z.string().uuid(),
  globalCandidateId: z.string().uuid().optional(),
  candidateId: z.string().max(100),
  candidateName: z.string().max(500).optional(),
  profileUrl: z.string().url().optional(),
  telegramUsername: z.string().max(100).optional(),
  chatId: z.string().max(100).optional(),
  phone: phoneSchema,
  email: z.string().email().max(255).optional(),
  resumeLanguage: z.string().max(10).default("ru").optional(),
  telegramPinCode: z.string().length(4).optional(),
  // Gig fields
  proposedPrice: z.number().int().positive().optional(),
  proposedDeliveryDays: z.number().int().positive().optional(),
  portfolioLinks: z.array(z.string().url()).optional(),
  // Vacancy fields
  resumeId: z.string().max(100).optional(),
  resumeUrl: z.string().optional(),
  platformProfileUrl: z.string().optional(),
  salaryExpectationsAmount: z.number().int().optional(),
  salaryExpectationsComment: z.string().max(200).optional(),
  // Common
  coverLetter: z.string().optional(),
  skills: z.array(z.string()).optional(),
  rating: z.string().max(20).optional(),
  status: z.enum(responseStatusValues).default("NEW"),
  hrSelectionStatus: z.enum(hrSelectionStatusValues).optional(),
  importSource: z.enum(importSourceValues).default("MANUAL"),
  respondedAt: z.coerce.date().optional(),
  welcomeSentAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateResponseSchema = CreateResponseSchema.partial();

export type Response = typeof response.$inferSelect;
export type NewResponse = typeof response.$inferInsert;
export type ResponseEntityType =
  (typeof responseEntityTypeEnum.enumValues)[number];

// Re-export types from shared for convenience
export type {
  HrSelectionStatus,
  ImportSource,
  ResponseStatus,
} from "../shared/response-enums";

// Re-export enum values for backward compatibility
export {
  hrSelectionStatusValues,
  importSourceValues,
  responseStatusValues,
} from "../shared/response-enums";
