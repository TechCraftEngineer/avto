import type { DbClient } from "@qbs-autonaim/db";
import { and, eq, gte, lt, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
} from "@qbs-autonaim/db/schema";

export type ScreeningFilterType =
  | "all"
  | "evaluated"
  | "not-evaluated"
  | "high-score"
  | "low-score";

export async function getFilteredResponseIds(
  db: DbClient,
  vacancyId: string,
  screeningFilter: ScreeningFilterType,
): Promise<string[] | null> {
  if (screeningFilter === "all") {
    return null;
  }

  if (screeningFilter === "evaluated") {
    const screenedResponses = await db
      .select({ responseId: responseScreening.responseId })
      .from(responseScreening)
      .innerJoin(
        responseTable,
        eq(responseScreening.responseId, responseTable.id),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, vacancyId),
        ),
      );
    return screenedResponses.map((r: { responseId: string }) => r.responseId);
  }

  if (screeningFilter === "not-evaluated") {
    const notEvaluated = await db
      .select({ id: responseTable.id })
      .from(responseTable)
      .leftJoin(
        responseScreening,
        eq(responseTable.id, responseScreening.responseId),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, vacancyId),
          sql`${responseScreening.responseId} IS NULL`,
        ),
      );
    return notEvaluated.map((r: { id: string }) => r.id);
  }

  if (screeningFilter === "high-score") {
    const screenedResponses = await db
      .select({ responseId: responseScreening.responseId })
      .from(responseScreening)
      .innerJoin(
        responseTable,
        eq(responseScreening.responseId, responseTable.id),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, vacancyId),
          gte(responseScreening.overallScore, 70),
        ),
      );
    return screenedResponses.map((r: { responseId: string }) => r.responseId);
  }

  if (screeningFilter === "low-score") {
    const screenedResponses = await db
      .select({ responseId: responseScreening.responseId })
      .from(responseScreening)
      .innerJoin(
        responseTable,
        eq(responseScreening.responseId, responseTable.id),
      )
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.entityId, vacancyId),
          lt(responseScreening.overallScore, 70),
        ),
      );
    return screenedResponses.map((r: { responseId: string }) => r.responseId);
  }

  return null;
}
