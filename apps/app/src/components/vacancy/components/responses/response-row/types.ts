import type { RouterOutputs } from "@qbs-autonaim/api";

export type ResponseRowData =
  RouterOutputs["vacancy"]["responses"]["list"]["responses"][0];

export interface ResponseRowProps {
  response: ResponseRowData;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  vacancyId?: string;
}
