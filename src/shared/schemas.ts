/**
 * Zod-схемы валидации для Recruitment Assistant Extension
 */

import { z } from "zod";

/**
 * Схема базовой информации о кандидате
 */
export const BasicInfoSchema = z.object({
  fullName: z.string().min(1, "Имя обязательно"),
  currentPosition: z.string(),
  location: z.string(),
  photoUrl: z.string().url().nullable(),
});

/**
 * Схема записи об опыте работы
 */
export const ExperienceEntrySchema = z.object({
  position: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  description: z.string(),
});

/**
 * Схема записи об образовании
 */
export const EducationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

/**
 * Схема контактной информации
 */
export const ContactInfoSchema = z.object({
  email: z.string().email().nullable().or(z.literal(null)),
  phone: z.string().nullable(),
  socialLinks: z.array(z.string().url()),
});

/**
 * Схема полной структуры данных кандидата
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
 * Схема учетных данных для авторизации
 */
export const AuthCredentialsSchema = z.object({
  email: z.string().email("Некорректный адрес электронной почты"),
  password: z.string().min(1, "Пароль обязателен"),
});

/**
 * Схема ответа от сервера авторизации
 */
export const AuthResponseSchema = z.object({
  success: z.boolean(),
  token: z.string().optional(),
  user: z
    .object({
      id: z.string(),
      email: z.string().email(),
      organizationId: z.string(),
    })
    .optional(),
  message: z.string().optional(),
});

/**
 * Схема настроек расширения
 */
export const SettingsSchema = z.object({
  apiUrl: z.string().url("Некорректный URL API"),
  apiToken: z.string(),
  fieldsToExtract: z.object({
    basicInfo: z.boolean(),
    experience: z.boolean(),
    education: z.boolean(),
    skills: z.boolean(),
    contacts: z.boolean(),
  }),
});

/**
 * Схема запроса на импорт кандидата
 */
export const ImportCandidateRequestSchema = z.object({
  candidate: z.object({
    fullName: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    headline: z.string().optional(),
    photoUrl: z.string().url().optional(),
    skills: z.array(z.string()).optional(),
    experienceYears: z.number().optional(),
    profileData: z
      .object({
        experience: z.array(ExperienceEntrySchema),
        education: z.array(EducationEntrySchema),
      })
      .optional(),
    source: z.literal("SOURCING"),
    originalSource: z.enum(["LINKEDIN", "HEADHUNTER"]),
    parsingStatus: z.literal("COMPLETED"),
  }),
  organizationId: z.string(),
});

/**
 * Схема ответа на запрос импорта кандидата
 */
export const ImportCandidateResponseSchema = z.object({
  success: z.boolean(),
  candidateId: z.string().optional(),
  candidateOrganizationId: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Схема лога ошибки
 */
export const ErrorLogSchema = z.object({
  timestamp: z.date(),
  type: z.enum(["extraction", "validation", "network", "api", "config"]),
  message: z.string(),
  stack: z.string().optional(),
  context: z.any().optional(),
});

/**
 * Схема уведомления для пользователя
 */
export const NotificationSchema = z.object({
  type: z.enum(["success", "error", "warning", "info"]),
  message: z.string(),
  action: z
    .object({
      label: z.string(),
      callback: z.function(),
    })
    .optional(),
});
