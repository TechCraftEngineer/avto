/**
 * Zod схемы валидации для Recruitment Assistant Extension
 */

import type {
  BasicCandidateInfo,
  CandidateContactInfo,
  EducationEntry,
  FullCandidateData,
  WorkExperienceEntry,
} from "@qbs-autonaim/shared";
import { z } from "zod";

/**
 * Схема для записи об опыте работы
 */
export const ExperienceEntrySchema: z.ZodType<WorkExperienceEntry> = z.object({
  position: z.string(),
  company: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  description: z.string().nullable(),
  id: z.string().optional(),
});

/**
 * Схема для записи об образовании
 */
export const EducationEntrySchema: z.ZodType<EducationEntry> = z.object({
  institution: z.string(),
  degree: z.string().nullable().optional(),
  field: z.string().nullable().optional(),
  fieldOfStudy: z.string().optional(),
  graduationYear: z.number().nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  id: z.string().optional(),
});

/**
 * Схема для контактной информации
 */
export const ContactInfoSchema: z.ZodType<CandidateContactInfo> = z.object({
  email: z.email().nullable(),
  phone: z.string().nullable(),
  socialLinks: z.array(z.url()).optional(),
});

/**
 * Схема для базовой информации
 */
export const BasicInfoSchema: z.ZodType<BasicCandidateInfo> = z.object({
  fullName: z
    .string()
    .min(1, "Имя обязательно")
    .refine(
      (s) => s.trim().length >= 1,
      "Имя не может состоять только из пробелов",
    ),
  currentPosition: z.string(),
  location: z.string(),
  photoUrl: z.string().url().nullable(),
});

/**
 * Схема для полных данных кандидата
 */
export const CandidateDataSchema: z.ZodType<FullCandidateData> = z.object({
  platform: z.string(),
  profileUrl: z.string().url(),
  basicInfo: BasicInfoSchema,
  experience: z.array(ExperienceEntrySchema),
  education: z.array(EducationEntrySchema),
  skills: z.array(z.string()),
  contacts: ContactInfoSchema,
  extractedAt: z.date(),
});

/**
 * Схема для настроек расширения
 */
export const SettingsSchema = z.object({
  apiUrl: z.string().url(),
  apiToken: z.string().min(10),
  organizationId: z.string(),
  fieldsToExtract: z.object({
    basicInfo: z.boolean(),
    experience: z.boolean(),
    education: z.boolean(),
    skills: z.boolean(),
    contacts: z.boolean(),
  }),
});
