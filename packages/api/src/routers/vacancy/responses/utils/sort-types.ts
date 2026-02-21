/**
 * Централизованные типы сортировки для vacancy responses
 * Используются в list, list-workspace, sorting, sort-builder
 */

import { z } from "zod";
import type { SortDirection } from "@qbs-autonaim/types";

/** Поля для сортировки откликов на вакансию (полный набор для list) */
export type VacancyResponseSortField =
  | "createdAt"
  | "score"
  | "detailedScore"
  | "potentialScore"
  | "careerTrajectoryScore"
  | "priorityScore"
  | "salaryExpectationsAmount"
  | "compositeScore"
  | "status"
  | "respondedAt";

/** Подмножество для list-workspace (без salaryExpectationsAmount, compositeScore) */
export type VacancyResponseSortFieldWorkspace = Exclude<
  VacancyResponseSortField,
  "salaryExpectationsAmount" | "compositeScore"
> | null;

/** Алиас для единообразия с общим SortDirection */
export type VacancyResponseSortDirection = SortDirection;

/** Zod-схема для list (включает salaryExpectationsAmount, compositeScore) */
export const vacancyResponseSortFieldSchema = z
  .enum([
    "createdAt",
    "score",
    "detailedScore",
    "potentialScore",
    "careerTrajectoryScore",
    "priorityScore",
    "salaryExpectationsAmount",
    "compositeScore",
    "status",
    "respondedAt",
  ])
  .nullable()
  .default(null);

/** Zod-схема для list-workspace (подмножество полей) */
export const vacancyResponseSortFieldWorkspaceSchema = z
  .enum([
    "createdAt",
    "score",
    "detailedScore",
    "potentialScore",
    "careerTrajectoryScore",
    "priorityScore",
    "status",
    "respondedAt",
  ])
  .optional()
  .nullable()
  .default(null);

export const sortDirectionSchema = z
  .enum(["asc", "desc"])
  .default("desc") as z.ZodType<VacancyResponseSortDirection>;
