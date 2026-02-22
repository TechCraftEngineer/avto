import type { VacancyResponseListItem } from "~/types/api";
import type { ColumnId, SortDirection, SortField } from "../types";

export type ResponseListItem = VacancyResponseListItem;

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
