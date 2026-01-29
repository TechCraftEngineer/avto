import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "../auth/user";
import {
  platformSourceEnum,
  platformSourceValues,
} from "../shared/response-enums";
import { workspace } from "../workspace/workspace";

export interface VacancyRequirements {
  job_title: string;
  summary: string;
  mandatory_requirements: string[];
  nice_to_have_skills: string[];
  tech_stack: string[];
  experience_years: {
    min: number | null;
    description: string;
  };
  languages: Array<{
    language: string;
    level: string;
  }>;
  location_type: string;
  keywords_for_matching: string[];
}

export const vacancy = pgTable(
  "vacancies",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Workspace к которому принадлежит вакансия
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    // Ответственный рекрутер за вакансию
    ownerId: text("owner_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // Пользователь, создавший вакансию (для аудита)
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),

    title: varchar("title", { length: 500 }).notNull(),
    url: text("url"),
    views: integer("views").default(0),
    responses: integer("responses").default(0),
    newResponses: integer("new_responses").default(0),
    resumesInProgress: integer("resumes_in_progress").default(0),
    suitableResumes: integer("suitable_resumes").default(0),
    region: varchar("region", { length: 200 }),
    description: text("description"),
    requirements: jsonb("requirements").$type<VacancyRequirements>(),

    // Источник вакансии (hh, avito, superjob)
    source: platformSourceEnum("source").notNull().default("HH"),
    // ID вакансии на внешней платформе
    externalId: varchar("external_id", { length: 100 }),

    mergedIntoVacancyId: uuid("merged_into_vacancy_id"),

    // Кастомные настройки для бота
    customBotInstructions: text("custom_bot_instructions"),
    customScreeningPrompt: text("custom_screening_prompt"),
    customInterviewQuestions: text("custom_interview_questions"),
    customOrganizationalQuestions: text("custom_organizational_questions"),

    // Настройки каналов общения
    enabledCommunicationChannels: jsonb("enabled_communication_channels")
      .$type<{
        webChat: boolean;
        telegram: boolean;
      }>()
      .default({
        webChat: true,
        telegram: false,
      }),

    // Кастомный домен для веб-чата (ID кастомного домена)
    customDomainId: text("custom_domain_id"),

    // Шаблоны приветственных сообщений для разных каналов
    welcomeMessageTemplates: jsonb("welcome_message_templates").$type<{
      webChat?: string;
      telegram?: string;
    }>(),

    // Настройки фильтров кандидатов
    candidateFilters: jsonb("candidate_filters").$type<{
      autoFilteringEnabled?: boolean;
      minExperienceYears?: number;
      requiredSkills?: string[];
      preferredLocation?: string;
      excludeKeywords?: string[];
      minScoreThreshold?: number;
    }>(),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("vacancy_workspace_idx").on(table.workspaceId),
    // Partial index для активных вакансий
    activeVacanciesIdx: index("vacancy_active_idx")
      .on(table.workspaceId, table.isActive)
      .where(sql`${table.isActive} = true`),
    mergedIntoVacancyFk: foreignKey({
      columns: [table.mergedIntoVacancyId],
      foreignColumns: [table.id],
    }).onDelete("set null"),
    sourceExternalIdx: index("vacancy_source_external_idx").on(
      table.source,
      table.externalId,
    ),
    requirementsIdx: index("vacancy_requirements_idx").using(
      "gin",
      table.requirements,
    ),
  }),
);

export const CreateVacancySchema = createInsertSchema(vacancy, {
  title: z.string().max(500),
  url: z.string().optional(),
  source: z.enum(platformSourceValues).default("HH"),
  externalId: z.string().max(100).optional(),
  customBotInstructions: z.string().max(5000).optional(),
  customScreeningPrompt: z.string().max(5000).optional(),
  customInterviewQuestions: z.string().max(5000).optional(),
  customOrganizationalQuestions: z.string().max(5000).optional(),
  enabledCommunicationChannels: z
    .object({
      webChat: z.boolean(),
      telegram: z.boolean(),
    })
    .optional(),
  welcomeMessageTemplates: z
    .object({
      webChat: z.string().max(2000).optional(),
      telegram: z.string().max(2000).optional(),
    })
    .optional(),
  candidateFilters: z
    .object({
      autoFilteringEnabled: z.boolean().optional(),
      minExperienceYears: z.number().min(0).max(20).optional(),
      requiredSkills: z.array(z.string()).optional(),
      preferredLocation: z.string().max(100).optional(),
      excludeKeywords: z.array(z.string()).optional(),
      minScoreThreshold: z.number().min(0).max(100).optional(),
    })
    .optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateVacancySettingsSchema = z.object({
  customBotInstructions: z.string().max(5000).nullish(),
  customScreeningPrompt: z.string().max(5000).nullish(),
  customInterviewQuestions: z.string().max(5000).nullish(),
  customOrganizationalQuestions: z.string().max(5000).nullish(),
  enabledCommunicationChannels: z
    .object({
      webChat: z.boolean(),
      telegram: z.boolean(),
    })
    .optional(),
  welcomeMessageTemplates: z
    .object({
      webChat: z.string().max(2000).optional(),
      telegram: z.string().max(2000).optional(),
    })
    .optional(),
  candidateFilters: z
    .object({
      autoFilteringEnabled: z.boolean().optional(),
      minExperienceYears: z.number().min(0).max(20).optional(),
      requiredSkills: z.array(z.string()).optional(),
      preferredLocation: z.string().max(100).optional(),
      excludeKeywords: z.array(z.string()).optional(),
      minScoreThreshold: z.number().min(0).max(100).optional(),
    })
    .optional(),
  customDomainId: z.string().nullable().optional(), // ID кастомного домена для веб-чата
});

export type Vacancy = typeof vacancy.$inferSelect;
export type NewVacancy = typeof vacancy.$inferInsert;

// Тип для вакансии с информацией об owner
export type VacancyWithOwner = Vacancy & {
  owner: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
};

// Тип для вакансии с полной информацией (owner + creator)
export type VacancyWithDetails = Vacancy & {
  owner: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  createdByUser: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};
