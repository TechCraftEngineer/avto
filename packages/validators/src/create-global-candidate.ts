/**
 * Схема валидации для формы ручного создания кандидата.
 */

import { z } from "zod";
import { phoneSchema } from "./phone";

const englishLevelEnum = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
const workFormatEnum = z.enum(["remote", "office", "hybrid"]);
const genderEnum = z.enum(["male", "female"]);

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
  salaryExpectationsAmount: z.number().int().min(0).optional(),
  workFormat: workFormatEnum.optional(),
  englishLevel: englishLevelEnum.optional(),
  readyForRelocation: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateGlobalCandidateFormValues = z.infer<
  typeof createGlobalCandidateFormSchema
>;
