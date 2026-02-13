import { z } from "zod";

/**
 * Схема для валидации URL проекта Kwork при импорте по ссылке
 */
export const GigImportByUrlSchema = z.object({
  url: z
    .string()
    .url("Введите корректную ссылку")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          const hostname = parsed.hostname.toLowerCase();
          const isKwork =
            hostname === "kwork.ru" || hostname === "www.kwork.ru";
          if (!isKwork) return false;
          return /^\/project\/\d+\/?$/.test(parsed.pathname);
        } catch {
          return false;
        }
      },
      "Ссылка должна быть на проект с kwork.ru",
    ),
});

export type GigImportByUrl = z.infer<typeof GigImportByUrlSchema>;
