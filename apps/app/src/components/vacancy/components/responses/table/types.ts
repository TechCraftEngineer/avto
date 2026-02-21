import type { RouterOutputs } from "@qbs-autonaim/api";
import type { ColumnId, SortDirection, SortField } from "../types";

export type ResponseListItem =
  RouterOutputs["vacancy"]["responses"]["list"]["responses"][0];

export interface ResponseTableMeta {
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  vacancyId: string;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  visibleColumnIds: ReadonlySet<ColumnId>;
}
