import type { SQL } from "@qbs-autonaim/db";
import { asc, desc, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
} from "@qbs-autonaim/db/schema";

export type SortField =
  | "createdAt"
  | "score"
  | "detailedScore"
  | "potentialScore"
  | "careerTrajectoryScore"
  | "priorityScore"
  | "salaryExpectationsAmount"
  | "compositeScore"
  | "status"
  | "respondedAt";

export type SortDirection = "asc" | "desc";

export function getOrderByClause(
  sortField: SortField | null,
  sortDirection: SortDirection,
): SQL {
  if (sortField === "createdAt") {
    return sortDirection === "asc"
      ? asc(responseTable.createdAt)
      : desc(responseTable.createdAt);
  }

  if (sortField === "status") {
    return sortDirection === "asc"
      ? asc(responseTable.status)
      : desc(responseTable.status);
  }

  if (sortField === "respondedAt") {
    return sortDirection === "asc"
      ? asc(responseTable.respondedAt)
      : desc(responseTable.respondedAt);
  }

  if (sortField === "priorityScore") {
    // Для сортировки по priorityScore используем вычисление на лету
    // Сортируем после получения данных
    return desc(responseTable.createdAt); // Временная сортировка, будет пересортировано позже
  }

  if (
    sortField === "score" ||
    sortField === "detailedScore" ||
    sortField === "potentialScore" ||
    sortField === "careerTrajectoryScore" ||
    sortField === "salaryExpectationsAmount" ||
    sortField === "compositeScore"
  ) {
    // Для сортировки по score полям используем LEFT JOIN с responseScreening
    const scoreColumn =
      sortField === "score"
        ? responseScreening.overallScore
        : sortField === "detailedScore"
          ? responseScreening.overallScore // detailedScore вычисляется из overallScore
          : sortField === "potentialScore"
            ? responseScreening.potentialScore
            : sortField === "careerTrajectoryScore"
              ? responseScreening.careerTrajectoryScore
              : sortField === "salaryExpectationsAmount"
                ? responseTable.salaryExpectationsAmount
                : responseScreening.overallScore; // compositeScore = overallScore

    return sortDirection === "asc"
      ? asc(sql`COALESCE(${scoreColumn}, -1)`)
      : desc(sql`COALESCE(${scoreColumn}, -1)`);
  }

  return desc(responseTable.createdAt);
}

export function needsScoreJoin(sortField: SortField | null): boolean {
  return (
    sortField === "score" ||
    sortField === "detailedScore" ||
    sortField === "potentialScore" ||
    sortField === "careerTrajectoryScore"
  );
}
