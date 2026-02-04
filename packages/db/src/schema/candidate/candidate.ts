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
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { file } from "../file";
import { organization } from "../organization/organization";
import { platformSourceEnum } from "../shared/response-enums";
import type { StoredProfileData } from "../types";

/**
 * Источник появления кандидата в базе
 */
export const candidateSourceEnum = pgEnum("candidate_source", [
  "APPLICANT", // Откликнулся сам
  "SOURCING", // Найден рекрутером (холодный поиск/парсинг)
  "IMPORT", // Массовый импорт
  "MANUAL", // Ручное создание
  "REFERRAL", // Рекомендация
]);

/**
 * Статус обработки данных парсером
 */
export const parsingStatusEnum = pgEnum("parsing_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const candidateStatusEnum = pgEnum("candidate_status", [
  "ACTIVE",
  "BLACKLISTED",
  "HIRED",
  "PASSIVE",
]);

export const englishLevelEnum = pgEnum("english_level", [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
]);

export const workFormatEnum = pgEnum("work_format", [
  "remote",
  "office",
  "hybrid",
]);

/**
 * Глобальный профиль кандидата (Talent Pool).
 * Позволяет накапливать базу талантов организации независимо от конкретных вакансий.
 * Сюда линкуются отклики (VacancyResponse) и гиги (GigResponse).
 */
export const candidate = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Привязка к организации (владелец базы талантов)
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Основная информация (ФИО для РФ рынка)
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    middleName: varchar("middle_name", { length: 100 }), // Отчество
    fullName: varchar("full_name", { length: 500 }).notNull(), // Храним и полное для удобства поиска

    headline: varchar("headline", { length: 255 }), // "Профессия" (напр. "Java Разработчик")

    // Личные данные (критично для РФ)
    birthDate: timestamp("birth_date", { withTimezone: true, mode: "date" }),
    gender: genderEnum("gender"), // "male", "female"
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
    workFormat: workFormatEnum("work_format"), // remote, office, hybrid

    // Детали по опыту
    englishLevel: englishLevelEnum("english_level"), // A1-C2
    readyForRelocation: boolean("ready_for_relocation").default(false),

    // Статус в базе (например, "BLACKLISTED", "HIRED", "PASSIVE")
    status: candidateStatusEnum("status").default("ACTIVE"),

    // Заметки рекрутера (общие по кандидату)
    notes: text("notes"),

    // --- Sourcing & Origin ---
    // Каким образом попал в базу
    source: candidateSourceEnum("source").default("APPLICANT").notNull(),
    // Конкретный источник (HH, HABR, etc.)
    originalSource: platformSourceEnum("original_source").default("MANUAL"),

    // Статус парсинга (если добавляем через AI-парсером)
    parsingStatus: parsingStatusEnum("parsing_status")
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
    orgIdx: index("candidate_org_idx").on(table.organizationId),
    emailIdx: index("candidate_email_idx").on(table.email),
    phoneIdx: index("candidate_phone_idx").on(table.phone),
    telegramIdx: index("candidate_telegram_idx").on(table.telegramUsername),
    skillsIdx: index("candidate_skills_idx").using("gin", table.skills),
    profileDataIdx: index("candidate_profile_data_idx").using(
      "gin",
      table.profileData,
    ),
    tagsIdx: index("candidate_tags_idx").using("gin", table.tags),
    statusIdx: index("candidate_status_idx").on(table.status),
    sourceIdx: index("candidate_source_idx").on(table.source),
  }),
);

export const CreateCandidateSchema = createInsertSchema(candidate, {
  fullName: z.string().min(1).max(500),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  middleName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: phoneSchema,
  birthDate: z.coerce.date().optional(),
  citizenship: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  salaryExpectationsAmount: z.number().int().optional(),
  telegramUsername: z.string().max(100).optional(),
  profileData: z.any(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  gender: z.enum(genderEnum.enumValues).optional(),
  status: z.enum(candidateStatusEnum.enumValues).default("ACTIVE"),
  englishLevel: z.enum(englishLevelEnum.enumValues).optional(),
  workFormat: z.enum(workFormatEnum.enumValues).optional(),
  source: z.enum(candidateSourceEnum.enumValues).optional(),
  originalSource: z.enum(platformSourceEnum.enumValues).default("MANUAL"),
  tags: z.array(z.string()).optional(),
  isSearchable: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Candidate = typeof candidate.$inferSelect;
export type NewCandidate = typeof candidate.$inferInsert;
