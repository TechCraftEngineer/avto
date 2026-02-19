import {
  eq,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  type SQL,
  sql,
} from "@qbs-autonaim/db";
import { candidateOrganization, globalCandidate } from "@qbs-autonaim/db/schema";
import type { ListInput } from "./list-schema";

/** lastActivity: MAX(ответы) или updated_at связи */
export function lastActivityExpr() {
  return sql`COALESCE(
    (SELECT MAX(r.updated_at) FROM responses r
     WHERE r.global_candidate_id = ${globalCandidate.id} AND r.entity_type = 'vacancy'),
    ${candidateOrganization.updatedAt}
  )`;
}

export function buildFilterConditions(
  input: ListInput,
  options?: { cursor?: string },
): SQL<unknown>[] {
  const conditions: SQL<unknown>[] = [
    eq(candidateOrganization.organizationId, input.organizationId),
  ];

  if (input.status?.length) {
    conditions.push(inArray(candidateOrganization.status, input.status));
  }

  if (input.search) {
    const searchPattern = `%${input.search}%`;
    const searchCondition = or(
      ilike(globalCandidate.fullName, searchPattern),
      ilike(globalCandidate.email, searchPattern),
      ilike(globalCandidate.phone, searchPattern),
      ilike(globalCandidate.telegramUsername, searchPattern),
      ilike(globalCandidate.headline, searchPattern),
      ilike(globalCandidate.location, searchPattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (input.skills?.length) {
    const skillsConditions = input.skills.map(
      (skill) =>
        sql`${globalCandidate.skills}::jsonb @> ${JSON.stringify([skill])}::jsonb`,
    );
    const skillsCondition = or(...skillsConditions);
    if (skillsCondition) conditions.push(skillsCondition);
  }

  if (input.vacancyId) {
    // Кандидаты, у которых есть отклик на выбранную вакансию
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM responses r
        WHERE r.global_candidate_id = ${globalCandidate.id}
          AND r.entity_type = 'vacancy'
          AND r.entity_id = ${input.vacancyId}
      )`,
    );
  }

  if (input.lastActivityFrom) {
    conditions.push(
      gte(
        lastActivityExpr(),
        sql`${input.lastActivityFrom.toISOString()}::timestamptz`,
      ),
    );
  }
  if (input.lastActivityTo) {
    conditions.push(
      lte(
        lastActivityExpr(),
        sql`${input.lastActivityTo.toISOString()}::timestamptz`,
      ),
    );
  }

  if (options?.cursor) {
    conditions.push(lt(candidateOrganization.id, options.cursor));
  }

  return conditions;
}
