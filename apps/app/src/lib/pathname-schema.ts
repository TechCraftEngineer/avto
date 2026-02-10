import { z } from "zod";

/**
 * Схема валидации для pathname
 * Разрешает только безопасные пути начинающиеся с /
 */
export const pathnameSchema = z
  .string()
  .min(1, "Pathname не может быть пустым")
  .max(2048, "Pathname слишком длинный")
  .regex(/^\/[\w\-./[\]()@]*$/, "Pathname содержит недопустимые символы")
  .refine(
    (path) => !path.includes(".."),
    "Pathname не может содержать обход директорий",
  );
