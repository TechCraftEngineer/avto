/**
 * Общие Zod-схемы для tRPC API.
 * Используются в routers для пагинации, фильтров и сортировки.
 */

import { z } from "zod";

/** Статусы отклика для фильтра vacancy responses */
export const vacancyResponseStatusValues = [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "COMPLETED",
  "SKIPPED",
] as const;

export const vacancyResponseStatusFilterSchema = z
  .array(z.enum(vacancyResponseStatusValues))
  .optional();

export type VacancyResponseStatusFilter = z.infer<
  typeof vacancyResponseStatusFilterSchema
>;

/** Фильтр скрининга откликов */
export const screeningFilterValues = [
  "all",
  "evaluated",
  "not-evaluated",
  "high-score",
  "low-score",
] as const;

export const screeningFilterSchema = z
  .enum(screeningFilterValues)
  .default("all");

export type ScreeningFilter = z.infer<typeof screeningFilterSchema>;

/** Пагинация (базовые параметры) */
export const paginationPageSchema = z.number().int().min(1).default(1);
export const paginationInputSchema = z.object({
  page: paginationPageSchema,
  limit: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationInputSchema>;

/** Варианты лимита для разных контекстов */
export const paginationLimitSchema = (
  opts: { default?: number; max?: number } = {},
) => {
  const { default: def = 20, max = 100 } = opts;
  return z.number().int().min(1).max(max).default(def);
};

/** Направление сортировки */
export const sortDirectionSchema = z
  .enum(["asc", "desc"])
  .default("desc") as z.ZodType<"asc" | "desc">;

export type SortDirection = "asc" | "desc";
