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
  | "salaryExpectationsAmount"
  | "compositeScore"
  | "respondedAt"
  | null;

export type SortDirection = "asc" | "desc";
