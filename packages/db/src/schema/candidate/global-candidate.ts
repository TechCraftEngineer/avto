/**
 * Глобальная таблица кандидатов (Talent Pool).
 * Единый реестр всех кандидатов, собираемых из различных источников и ресурсов.
 * Один кандидат может быть связан с несколькими организациями через таблицу candidate_organizations.
 */

import { phoneSchema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { file } from "../file";
import { platformSourceEnum } from "../shared/response-enums";
import type { StoredProfileData } from "../types";

/**
 * Источник появления кандидата в базе
 */
export const globalCandidateSourceEnum = pgEnum("global_candidate_source", [
  "APPLICANT", // Откликнулся сам
  "SOURCING", // Найден рекрутером (холодный поиск/парсинг)
  "IMPORT", // Массовый импорт
  "MANUAL", // Ручное создание
  "REFERRAL", // Рекомендация
]);

/**
 * Статус обработки данных парсером
 */
export const globalParsingStatusEnum = pgEnum("global_parsing_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

export const globalGenderEnum = pgEnum("global_gender", ["male", "female"]);

/**
 * Глобальный статус кандидата (не привязан к конкретной организации)
 */
export const globalCandidateStatusEnum = pgEnum("global_candidate_status", [
  "ACTIVE",
  "BLACKLISTED",
  "HIRED",
  "PASSIVE",
]);

export const globalEnglishLevelEnum = pgEnum("global_english_level", [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
]);

export const globalWorkFormatEnum = pgEnum("global_work_format", [
  "remote",
  "office",
  "hybrid",
]);

/**
 * Глобальная таблица кандидатов.
 * Служит единым реестром всех кандидатов из различных источников.
 * Один кандидат может быть связан с несколькими организациями.
 */
export const globalCandidate = pgTable(
  "global_candidates",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Основная информация (ФИО для РФ рынка)
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    middleName: varchar("middle_name", { length: 100 }), // Отчество
    fullName: varchar("full_name", { length: 500 }).notNull(), // Храним и полное для удобства поиска

    headline: varchar("headline", { length: 255 }), // "Профессия" (напр. "Java Разработчик")

    // Личные данные (критично для РФ)
    birthDate: timestamp("birth_date", { withTimezone: true, mode: "date" }),
    gender: globalGenderEnum("gender"), // "male", "female"
    citizenship: varchar("citizenship", { length: 100 }), // Гражданство (важно для оформления)
    location: varchar("location", { length: 200 }), // Город проживания

    // Контактные данные
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    telegramUsername: varchar("telegram_username", { length: 100 }),
    resumeLanguage: varchar("resume_language", { length: 10 }).default("ru"),

    // Файлы
    photoFileId: uuid("photo_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

    resumeUrl: text("resume_url"),
    // Распаршенные/обогащенные данные
    profileData: jsonb("profile_data").$type<StoredProfileData>(),
    skills: jsonb("skills").$type<string[]>(),
    experienceYears: integer("experience_years"),

    // Зарплатные ожидания
    salaryExpectationsAmount: integer("salary_expectations_amount"),
    workFormat: globalWorkFormatEnum("work_format"), // remote, office, hybrid

    // Детали по опыту
    englishLevel: globalEnglishLevelEnum("english_level"), // A1-C2
    readyForRelocation: boolean("ready_for_relocation").default(false),

    // Глобальный статус в базе (например, "BLACKLISTED", "HIRED", "PASSIVE")
    status: globalCandidateStatusEnum("status").default("ACTIVE"),

    // Заметки рекрутера (общие по кандидату, видимые всем организациям)
    notes: text("notes"),

    // --- Sourcing & Origin ---
    // Каким образом попал в базу
    source: globalCandidateSourceEnum("source").default("APPLICANT").notNull(),
    // Конкретный источник (HH, HABR, etc.)
    originalSource: platformSourceEnum("original_source").default("MANUAL"),

    // Статус парсинга (если добавляем через AI-парсером)
    parsingStatus: globalParsingStatusEnum("parsing_status")
      .default("COMPLETED")
      .notNull(),

    // Теги для быстрого поиска и сегментации (напр. ["senior", "reserve", "msk"])
    tags: jsonb("tags").$type<string[]>(),

    // --- Search & Privacy ---
    // Видим ли в глобальном поиске для клиентов (если false - только для внутренних рекрутеров)
    isSearchable: boolean("is_searchable").default(true),

    // Метаданные
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    emailIdx: index("global_candidate_email_idx").on(table.email),
    phoneIdx: index("global_candidate_phone_idx").on(table.phone),
    telegramIdx: index("global_candidate_telegram_idx").on(
      table.telegramUsername,
    ),
    // Уникальность контактов: один email/phone/telegram = один кандидат (NULL допускает множественные записи)
    emailUnique: unique("global_candidate_email_unique").on(table.email),
    phoneUnique: unique("global_candidate_phone_unique").on(table.phone),
    telegramUnique: unique("global_candidate_telegram_unique").on(
      table.telegramUsername,
    ),
    skillsIdx: index("global_candidate_skills_idx").using("gin", table.skills),
    profileDataIdx: index("global_candidate_profile_data_idx").using(
      "gin",
      table.profileData,
    ),
    tagsIdx: index("global_candidate_tags_idx").using("gin", table.tags),
    statusIdx: index("global_candidate_status_idx").on(table.status),
    sourceIdx: index("global_candidate_source_idx").on(table.source),
    fullNameIdx: index("global_candidate_full_name_idx").on(table.fullName),
    locationIdx: index("global_candidate_location_idx").on(table.location),
  }),
);

export const CreateGlobalCandidateSchema = createInsertSchema(globalCandidate, {
  fullName: z.string().min(1).max(500),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  middleName: z.string().max(100).optional(),
  email: z.email().optional().or(z.literal("")),
  phone: phoneSchema,
  birthDate: z.coerce.date().optional(),
  citizenship: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  salaryExpectationsAmount: z.number().int().optional(),
  telegramUsername: z.string().max(100).optional(),
  profileData: z.custom<StoredProfileData>().nullable().optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  gender: z.enum(globalGenderEnum.enumValues).optional(),
  status: z.enum(globalCandidateStatusEnum.enumValues).default("ACTIVE"),
  englishLevel: z.enum(globalEnglishLevelEnum.enumValues).optional(),
  workFormat: z.enum(globalWorkFormatEnum.enumValues).optional(),
  source: z.enum(globalCandidateSourceEnum.enumValues).optional(),
  originalSource: z.enum(platformSourceEnum.enumValues).default("MANUAL"),
  tags: z.array(z.string()).optional(),
  isSearchable: z.boolean().default(true),
  metadata: z
    .record(
      z.string(),
      z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.array(z.string()),
        z.array(z.number()),
        z.record(z.string(), z.unknown()),
      ]),
    )
    .optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GlobalCandidate = typeof globalCandidate.$inferSelect;
export type NewGlobalCandidate = typeof globalCandidate.$inferInsert;
