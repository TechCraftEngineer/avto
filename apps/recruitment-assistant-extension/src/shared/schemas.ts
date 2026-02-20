/**
 * Zod схемы валидации для Recruitment Assistant Extension
 */

import { z } from "zod";
import type {
  WorkExperienceEntry,
  EducationEntry,
  CandidateContactInfo,
  BasicCandidateInfo,
  FullCandidateData,
} from "@qbs-autonaim/shared";

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
  degree: z.string().nullable(),
  field: z.string().nullable(),
  fieldOfStudy: z.string(),
  graduationYear: z.number().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  id: z.string().optional(),
});

/**
 * Схема для контактной информации
 */
export const ContactInfoSchema: z.ZodType<CandidateContactInfo> = z.object({
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  socialLinks: z.array(z.string().url()).optional(),
});

/**
 * Схема для базовой информации
 */
export const BasicInfoSchema: z.ZodType<BasicCandidateInfo> = z.object({
  fullName: z.string().min(1, "Имя обязательно"),
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
