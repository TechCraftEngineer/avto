/**
 * Общие Zod-схемы для tRPC API.
 * Используются в routers для пагинации, фильтров и сортировки.
 */

import { vacancyResponseStatusFilterValues } from "@qbs-autonaim/types";
import { z } from "zod";

/** Re-export для обратной совместимости */
export const vacancyResponseStatusValues = vacancyResponseStatusFilterValues;

export const vacancyResponseStatusFilterSchema = z
  .array(z.enum(vacancyResponseStatusFilterValues))
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
export const paginationOffsetSchema = z.number().int().min(0).default(0);
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
