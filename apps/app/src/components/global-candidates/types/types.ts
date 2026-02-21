import type { RouterOutputs } from "@qbs-autonaim/api";

export type GlobalCandidate =
  RouterOutputs["globalCandidates"]["list"]["items"][number];

export type GlobalCandidateDetail = RouterOutputs["globalCandidates"]["get"];

export type CandidateStatus = "ACTIVE" | "BLACKLISTED" | "HIRED";

export const CANDIDATE_STATUS_LABELS: Record<
  CandidateStatus,
  string
> & { [key: string]: string } = {
  ACTIVE: "Активен",
  BLACKLISTED: "В чёрном списке",
  HIRED: "Нанят",
};

export const CANDIDATE_STATUS_COLORS: Record<
  CandidateStatus,
  string
> & { [key: string]: string } = {
  ACTIVE:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
  BLACKLISTED:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400",
  HIRED:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
};

export type ViewMode = "table" | "cards";

export interface CandidateFilters {
  search: string;
  status: CandidateStatus[];
  vacancyId: string | undefined;
  skills: string[];
  lastActivityFrom: Date | undefined;
  lastActivityTo: Date | undefined;
}

export type SortField = "createdAt" | "updatedAt" | "fullName" | "lastActivity";
export type SortOrder = "asc" | "desc";

export interface CandidateSort {
  field: SortField;
  order: SortOrder;
}
