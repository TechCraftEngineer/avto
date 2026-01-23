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
    enabledCommunicationChannels: jsonb("enabled_communication_channels").$type<{
      webChat: boolean;
      telegram: boolean;
    }>().default({
      webChat: true,
      telegram: false,
    }),

    // Шаблоны приветственных сообщений для разных каналов
    welcomeMessageTemplates: jsonb("welcome_message_templates").$type<{
      webChat?: string;
      telegram?: string;
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
  enabledCommunicationChannels: z.object({
    webChat: z.boolean(),
    telegram: z.boolean(),
  }).optional(),
  welcomeMessageTemplates: z.object({
    webChat: z.string().max(2000).optional(),
    telegram: z.string().max(2000).optional(),
  }).optional(),
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
  enabledCommunicationChannels: z.object({
    webChat: z.boolean(),
    telegram: z.boolean(),
  }).optional(),
  welcomeMessageTemplates: z.object({
    webChat: z.string().max(2000).optional(),
    telegram: z.string().max(2000).optional(),
  }).optional(),
});
