export type ScreeningFilter =
  | "all"
  | "evaluated"
  | "not-evaluated"
  | "high-score"
  | "low-score";

export type SortField =
  | "status"
  | "priorityScore"
  | "detailedScore"
  | "potentialScore"
  | "careerTrajectoryScore"
  | "respondedAt"
  | null;

export type SortDirection = "asc" | "desc";
