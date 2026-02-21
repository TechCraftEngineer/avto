import type {
  VacancyResponseSortDirection,
  VacancyResponseSortField,
} from "@qbs-autonaim/api";

export type ScreeningFilter =
  | "all"
  | "evaluated"
  | "not-evaluated"
  | "high-score"
  | "low-score";

/** Централизованный тип из API (vacancy list) */
export type SortField = VacancyResponseSortField | null;

/** Централизованный тип из API */
export type SortDirection = VacancyResponseSortDirection;

export type ColumnId =
  | "candidate"
  | "status"
  | "priority"
  | "screening"
  | "potential"
  | "career"
  | "risks"
  | "salary"
  | "skills"
  | "interview"
  | "hrSelection"
  | "coverLetter"
  | "date"
  | "actions";
