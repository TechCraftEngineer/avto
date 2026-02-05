import type { RouterOutputs } from "@qbs-autonaim/api";

export type ResponseRowData =
  RouterOutputs["vacancy"]["responses"]["list"]["responses"][0];

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
  | "score"
  | "interview"
  | "hrSelection"
  | "coverLetter"
  | "date";

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
