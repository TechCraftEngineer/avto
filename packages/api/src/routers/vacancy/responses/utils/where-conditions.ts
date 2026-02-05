import type { SQL } from "@qbs-autonaim/db";
import { and, eq, ilike, inArray, sql } from "@qbs-autonaim/db";
import type { ResponseStatus } from "@qbs-autonaim/db/schema";
import { response as responseTable } from "@qbs-autonaim/db/schema";

/** Экранирует спецсимволы LIKE-паттерна для безопасного поиска */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export function buildWhereConditions(
  vacancyId: string,
  filteredResponseIds: string[] | null,
  search: string | undefined,
  statusFilter: ResponseStatus[] | undefined,
): SQL | undefined {
  const conditions: SQL[] = [
    eq(responseTable.entityType, "vacancy"),
    eq(responseTable.entityId, vacancyId),
  ];

  if (filteredResponseIds !== null) {
    if (filteredResponseIds.length === 0) {
      return sql`1 = 0`;
    }
    conditions.push(inArray(responseTable.id, filteredResponseIds));
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    const safePattern = escapeLikePattern(trimmedSearch);
    conditions.push(ilike(responseTable.candidateName, `%${safePattern}%`));
  }

  if (statusFilter && statusFilter.length > 0) {
    conditions.push(inArray(responseTable.status, statusFilter));
  }

  return and(...conditions);
}
