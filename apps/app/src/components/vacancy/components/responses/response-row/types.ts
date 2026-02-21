import type { VacancyResponseListItem } from "~/types/api";

export type ResponseRowData = VacancyResponseListItem;

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

export interface ResponseRowProps {
  response: ResponseRowData;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  vacancyId?: string;
  isColumnVisible: (columnId: ColumnId) => boolean;
}
