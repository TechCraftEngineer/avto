import type { VacancyRequirementsStrict } from "@qbs-autonaim/types";
import { z } from "zod";

export const updateVacancyDetailsSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Название вакансии обязательно" })
    .max(500, { message: "Название не должно превышать 500 символов" }),
  description: z
    .string()
    .max(50000, { message: "Описание не должно превышать 50000 символов" })
    .nullish(),
});

export type UpdateVacancyDetailsInput = z.infer<
  typeof updateVacancyDetailsSchema
>;

// Плоская схема со всеми полями (без .extend() для корректного вывода типов в Zod v4)
export const updateVacancySettingsSchema = z.object({
  customBotInstructions: z
    .string()
    .max(5000, { message: "Инструкции не должны превышать 5000 символов" })
    .nullish(),
  customScreeningPrompt: z
    .string()
    .max(5000, { message: "Промпт не должен превышать 5000 символов" })
    .nullish(),
  customInterviewQuestions: z
    .string()
    .max(5000, { message: "Вопросы не должны превышать 5000 символов" })
    .nullish(),
  customOrganizationalQuestions: z
    .string()
    .max(5000, { message: "Вопросы не должны превышать 5000 символов" })
    .nullish(),
  enabledCommunicationChannels: z
    .object({
      webChat: z.boolean(),
      telegram: z.boolean(),
    })
    .optional(),
  welcomeMessageTemplates: z
    .object({
      webChat: z
        .string()
        .max(2000, { message: "Шаблон не должен превышать 2000 символов" })
        .optional(),
      telegram: z
        .string()
        .max(2000, { message: "Шаблон не должен превышать 2000 символов" })
        .optional(),
    })
    .optional(),
  customDomainId: z.string().uuid().or(z.literal("")).nullish(),
});

export const vacancyRequirementsSchema = z.object({
  job_title: z.string(),
  summary: z.string(),
  mandatory_requirements: z.array(z.string()),
  nice_to_have_skills: z.array(z.string()),
  tech_stack: z.array(z.string()),
  experience_years: z.object({
    min: z.number().nullable(),
    description: z.string(),
  }),
  languages: z.array(
    z.object({
      language: z.string(),
      level: z.string(),
    }),
  ),
  location_type: z.string(),
  keywords_for_matching: z.array(z.string()),
}) satisfies z.ZodType<VacancyRequirementsStrict>;

export type VacancyRequirementsInput = z.infer<
  typeof vacancyRequirementsSchema
>;

export const updateFullVacancySchema = z.object({
  title: z
    .string()
    .min(1, { message: "Название вакансии обязательно" })
    .max(500, { message: "Название не должно превышать 500 символов" }),
  description: z
    .string()
    .max(50000, { message: "Описание не должно превышать 50000 символов" })
    .nullish(),
  requirements: vacancyRequirementsSchema.optional(),
  source: z
    .enum([
      "MANUAL",
      "HH",
      "FL_RU",
      "FREELANCE_RU",
      "AVITO",
      "SUPERJOB",
      "HABR",
      "KWORK",
      "WEB_LINK",
      "TELEGRAM",
    ])
    .nullish(),
  externalId: z
    .string()
    .max(100, { message: "Внешний ID не должен превышать 100 символов" })
    .nullish(),
  url: z
    .string()
    .url({ message: "Введите корректный URL" })
    .or(z.literal(""))
    .nullish(),
});

export type UpdateVacancySettingsInput = z.infer<
  typeof updateVacancySettingsSchema
>;

export type UpdateFullVacancyInput = z.infer<typeof updateFullVacancySchema>;
