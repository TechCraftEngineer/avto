/**
 * Zod схемы валидации для Recruitment Assistant Extension
 */

import { z } from "zod";

/**
 * Схема для записи об опыте работы
 */
export const ExperienceEntrySchema = z.object({
  position: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  description: z.string(),
});

/**
 * Схема для записи об образовании
 */
export const EducationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

/**
 * Схема для контактной информации
 */
export const ContactInfoSchema = z.object({
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  socialLinks: z.array(z.string().url()),
});

/**
 * Схема для базовой информации
 */
export const BasicInfoSchema = z.object({
  fullName: z.string().min(1, "Имя обязательно"),
  currentPosition: z.string(),
  location: z.string(),
  photoUrl: z.string().url().nullable(),
});

/**
 * Схема для полных данных кандидата
 */
export const CandidateDataSchema = z.object({
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
