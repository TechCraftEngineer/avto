import type {
  GigResponseDetail,
  GigResponseListItem,
  VacancyResponseDetail,
  VacancyResponseListWorkspaceItem,
} from "~/types/api";

export type ResponseItem = VacancyResponseListWorkspaceItem;
export type { GigResponseDetail, GigResponseListItem, VacancyResponseDetail };

export type ResponseStatus =
  | "NEW"
  | "EVALUATED"
  | "INTERVIEW"
  | "NEGOTIATION"
  | "COMPLETED"
  | "SKIPPED";
