import { and, eq, gte, inArray, lt, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import type { Database } from "../../../../types/database";

type ScreeningFilterType =
  | "all"
  | "evaluated"
  | "not-evaluated"
  | "high-score"
  | "low-score";

export async function getFilteredResponseIds(
  db: Database,
  vacancyIds: string[],
  filter: ScreeningFilterType,
): Promise<string[] | null> {
  if (filter === "all") return null;

  const baseCondition = and(
    eq(responseTable.entityType, "vacancy"),
    inArray(responseTable.entityId, vacancyIds),
  );

  switch (filter) {
    case "evaluated": {
      const result = await db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          responseTable,
          eq(responseScreening.responseId, responseTable.id),
        )
        .where(baseCondition);
      return result.map((r) => r.responseId);
    }

    case "not-evaluated": {
      const result = await db
        .select({ id: responseTable.id })
        .from(responseTable)
        .leftJoin(
          responseScreening,
          eq(responseTable.id, responseScreening.responseId),
        )
        .where(
          and(baseCondition, sql`${responseScreening.responseId} IS NULL`),
        );
      return result.map((r) => r.id);
    }

    case "high-score": {
      const result = await db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          responseTable,
          eq(responseScreening.responseId, responseTable.id),
        )
        .where(and(baseCondition, gte(responseScreening.overallScore, 4)));
      return result.map((r) => r.responseId);
    }

    case "low-score": {
      const result = await db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          responseTable,
          eq(responseScreening.responseId, responseTable.id),
        )
        .where(and(baseCondition, lt(responseScreening.overallScore, 4)));
      return result.map((r) => r.responseId);
    }
  }
}
