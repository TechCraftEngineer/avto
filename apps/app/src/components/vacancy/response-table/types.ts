export type SortField =
  | "score"
  | "detailedScore"
  | "potentialScore"
  | "careerTrajectoryScore"
  | "status"
  | "createdAt"
  | "respondedAt"
  | null;
export type SortDirection = "asc" | "desc";

export const STATUS_ORDER = {
  NEW: 1,
  EVALUATED: 2,
  INTERVIEW: 3,
  COMPLETED: 4,
  SKIPPED: 5,
} as const;
