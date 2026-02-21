import type { SQL } from "@qbs-autonaim/db";
import { asc, desc, sql } from "@qbs-autonaim/db";
import {
  response as responseTable,
  responseScreening,
} from "@qbs-autonaim/db/schema";
import type {
  VacancyResponseSortDirection,
  VacancyResponseSortFieldWorkspace,
} from "./sort-types";

export function buildOrderByClause(
  sortField: VacancyResponseSortFieldWorkspace,
  sortDirection: VacancyResponseSortDirection,
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
    return desc(responseTable.createdAt);
  }

  if (
    sortField === "score" ||
    sortField === "detailedScore" ||
    sortField === "potentialScore" ||
    sortField === "careerTrajectoryScore"
  ) {
    const scoreColumn =
      sortField === "score" || sortField === "detailedScore"
        ? responseScreening.overallScore
        : sortField === "potentialScore"
          ? responseScreening.potentialScore
          : responseScreening.careerTrajectoryScore;

    return sortDirection === "asc"
      ? asc(sql`COALESCE(${scoreColumn}, -1)`)
      : desc(sql`COALESCE(${scoreColumn}, -1)`);
  }

  return desc(responseTable.createdAt);
}

export function isScoreBasedSort(
  sortField: VacancyResponseSortFieldWorkspace,
): boolean {
  return (
    sortField === "score" ||
    sortField === "detailedScore" ||
    sortField === "potentialScore" ||
    sortField === "careerTrajectoryScore"
  );
}
