import { z } from "zod";

/**
 * Схема для валидации URL проекта Kwork при импорте по ссылке
 */
export const GigImportByUrlSchema = z.object({
  url: z
    .string()
    .url("Введите корректную ссылку")
    .refine(
      (url) => /kwork\.ru\/project\/\d+/.test(url),
      "Ссылка должна быть на проект с kwork.ru",
    ),
});

export type GigImportByUrl = z.infer<typeof GigImportByUrlSchema>;
