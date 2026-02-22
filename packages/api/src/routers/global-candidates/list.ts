import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray, sql } from "@qbs-autonaim/db";
import {
  candidateOrganization,
  globalCandidate,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../orpc";
import { buildFilterConditions } from "./list-filter-conditions";
import { mapLinksToItems } from "./list-mapper";
import { buildOrderBy } from "./list-order-by";
import { listInputSchema } from "./list-schema";

export const LIST_SELECT = {
  id: candidateOrganization.id,
  candidateId: candidateOrganization.candidateId,
  status: candidateOrganization.status,
  tags: candidateOrganization.tags,
  notes: candidateOrganization.notes,
  appliedAt: candidateOrganization.appliedAt,
  createdAt: candidateOrganization.createdAt,
  updatedAt: candidateOrganization.updatedAt,
  fullName: globalCandidate.fullName,
  firstName: globalCandidate.firstName,
  lastName: globalCandidate.lastName,
  middleName: globalCandidate.middleName,
  headline: globalCandidate.headline,
  email: globalCandidate.email,
  phone: globalCandidate.phone,
  telegramUsername: globalCandidate.telegramUsername,
  location: globalCandidate.location,
  skills: globalCandidate.skills,
  experienceYears: globalCandidate.experienceYears,
  salaryExpectationsAmount: globalCandidate.salaryExpectationsAmount,
  workFormat: globalCandidate.workFormat,
  englishLevel: globalCandidate.englishLevel,
  readyForRelocation: globalCandidate.readyForRelocation,
  photoFileId: globalCandidate.photoFileId,
  source: globalCandidate.source,
  originalSource: globalCandidate.originalSource,
  resumeUrl: globalCandidate.resumeUrl,
} as const;

export const list = protectedProcedure
  .input(listInputSchema)
  .handler(async ({ input, context }) => {
    const hasAccess = await context.organizationRepository.checkAccess(
      input.organizationId,
      context.session.user.id,
    );
    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    const conditions = buildFilterConditions(input, {
      cursor: input.cursor,
    });
    const orderBy = buildOrderBy(input);

    const candidateLinks = await context.db
      .select(LIST_SELECT)
      .from(candidateOrganization)
      .innerJoin(
        globalCandidate,
        eq(candidateOrganization.candidateId, globalCandidate.id),
      )
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(input.limit + 1);

    const nextCursor =
      candidateLinks.length > input.limit
        ? candidateLinks.slice(0, -1).at(-1)?.id
        : undefined;
    const links = candidateLinks.slice(0, input.limit);

    const totalConditions = buildFilterConditions(input);
    const totalResult = await context.db
      .select({ count: sql<number>`count(*)::int` })
      .from(candidateOrganization)
      .innerJoin(
        globalCandidate,
        eq(candidateOrganization.candidateId, globalCandidate.id),
      )
      .where(and(...totalConditions));
    const total = totalResult[0]?.count ?? 0;

    if (links.length === 0) {
      return { items: [], nextCursor: undefined, total };
    }

    const candidateIds = links.map((l) => l.candidateId);
    const responses = await context.db.query.response.findMany({
      where: and(
        inArray(responseTable.globalCandidateId, candidateIds),
        eq(responseTable.entityType, "vacancy"),
      ),
      with: { vacancy: { columns: { id: true, title: true } } },
      orderBy: [desc(responseTable.updatedAt)],
    });

    const responsesByCandidate = new Map<
      string,
      (typeof responses)[number][]
    >();
    for (const r of responses) {
      if (r.globalCandidateId) {
        const arr = responsesByCandidate.get(r.globalCandidateId) ?? [];
        arr.push(r);
        responsesByCandidate.set(r.globalCandidateId, arr);
      }
    }

    const items = mapLinksToItems(links, responsesByCandidate);
    return { items, nextCursor, total };
  });
