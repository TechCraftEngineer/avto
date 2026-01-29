import { z } from "zod";

/**
 * Схема для валидации URL вакансии при импорте по ссылке
 */
export const ImportByUrlSchema = z.object({
  url: z
    .string()
    .url("Введите корректную ссылку")
    .refine(
      (url) => url.includes("hh.ru/vacancy/"),
      "Ссылка должна быть на вакансию с hh.ru",
    ),
});

/**
 * Извлекает externalId из URL вакансии hh.ru
 * @param url - URL вакансии в формате https://hh.ru/vacancy/12345
 * @returns externalId или null если формат некорректный
 */
export function extractExternalIdFromUrl(url: string): string | null {
  const match = url.match(/hh\.ru\/vacancy\/(\d+)/);
  return match?.[1] ?? null;
}

/**
 * Схема для валидации данных вакансии
 */
export const VacancyDataSchema = z.object({
  title: z.string().min(1, "Название вакансии обязательно"),
  description: z.string().min(1, "Описание вакансии обязательно"),
  url: z.string().url("Некорректная ссылка на вакансию"),
  externalId: z.string().min(1, "Внешний идентификатор обязателен"),
  source: z.literal("HH"),
  isActive: z.boolean().default(true),
  salary: z
    .object({
      from: z.number().optional(),
      to: z.number().optional(),
      currency: z.string().optional(),
    })
    .optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  employment: z.string().optional(),
  schedule: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional(),
});

export type VacancyData = z.infer<typeof VacancyDataSchema>;
export type ImportByUrl = z.infer<typeof ImportByUrlSchema>;
