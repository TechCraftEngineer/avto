import type { SQL } from "@qbs-autonaim/db";
import { and, eq, ilike, inArray, sql } from "@qbs-autonaim/db";
import type { ResponseStatus } from "@qbs-autonaim/db/schema";
import { response as responseTable } from "@qbs-autonaim/db/schema";

export function buildWhereConditions(
  vacancyId: string,
  filteredResponseIds: string[] | null,
  search: string | undefined,
  statusFilter: ResponseStatus[] | undefined,
): SQL | undefined {
  const whereConditions: SQL[] = [
    eq(responseTable.entityType, "vacancy"),
    eq(responseTable.entityId, vacancyId),
  ];

  if (filteredResponseIds !== null) {
    if (filteredResponseIds.length === 0) {
      // Возвращаем условие, которое никогда не выполнится
      return sql`1 = 0`;
    }
    whereConditions.push(inArray(responseTable.id, filteredResponseIds));
  }

  // Добавляем поиск по ФИО кандидата
  if (search?.trim()) {
    whereConditions.push(
      ilike(responseTable.candidateName, `%${search.trim()}%`),
    );
  }

  // Добавляем фильтр по статусу
  if (statusFilter && statusFilter.length > 0) {
    whereConditions.push(inArray(responseTable.status, statusFilter));
  }

  return and(...whereConditions);
}
