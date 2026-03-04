/**
 * Схема валидации для формы ручного создания кандидата.
 */

import { z } from "zod";
import { phoneSchema } from "./phone";

const englishLevelEnum = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
const workFormatEnum = z.enum(["remote", "office", "hybrid"]);
const genderEnum = z.enum(["male", "female"]);

/** Один пункт опыта работы */
export const experienceEntrySchema = z.object({
  company: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  period: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
});

/** Один пункт образования */
export const educationEntrySchema = z.object({
  institution: z.string().max(200).optional(),
  degree: z.string().max(100).optional(),
  field: z.string().max(200).optional(),
  period: z.string().max(100).optional(),
  startDate: z.string().max(20).optional(),
  endDate: z.string().max(20).optional(),
});

export const createGlobalCandidateFormSchema = z.object({
  fullName: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, "Укажите ФИО")
        .max(500, "ФИО не может быть длиннее 500 символов"),
    ),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  middleName: z.string().max(100).optional(),
  email: z
    .union([z.literal(""), z.email({ message: "Некорректный email" })])
    .optional(),
  phone: phoneSchema,
  telegramUsername: z.string().max(100).optional(),
  headline: z.string().max(255).optional(),
  location: z.string().max(200).optional(),
  birthDate: z
    .union([z.coerce.date(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  gender: genderEnum.optional(),
  citizenship: z.string().max(100).optional(),
  skills: z.array(z.string().max(100)).optional(),
  experienceYears: z.number().int().min(0).optional(),
  salaryExpectationsAmount: z
    .number()
    .int()
    .min(0, { message: "Сумма не может быть отрицательной" })
    .optional(),
  workFormat: workFormatEnum.optional(),
  englishLevel: englishLevelEnum.optional(),
  readyForRelocation: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
  experience: z.array(experienceEntrySchema).optional(),
  education: z.array(educationEntrySchema).optional(),
});

export type CreateGlobalCandidateFormValues = z.infer<
  typeof createGlobalCandidateFormSchema
>;
