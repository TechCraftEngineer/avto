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
