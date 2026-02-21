import type { RouterOutputs } from "@qbs-autonaim/api";

export type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][0];

/** Детали gig-отклика (для response detail view) */
export type GigResponseDetail = NonNullable<
  RouterOutputs["gig"]["responses"]["get"]
>;

/** Детали vacancy-отклика (для response detail view) */
export type VacancyResponseDetail = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;

/** Элемент списка gig-откликов */
export type GigResponseListItem =
  RouterOutputs["gig"]["responses"]["list"]["items"][number];

export type ResponseStatus =
  | "NEW"
  | "EVALUATED"
  | "INTERVIEW"
  | "COMPLETED"
  | "SKIPPED";
