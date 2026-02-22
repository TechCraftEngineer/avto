import { ORPCError } from "@orpc/server";
import type { SQL } from "@qbs-autonaim/db";
import { and, eq, ilike, inArray, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import {
  paginationLimitSchema,
  paginationPageSchema,
  screeningFilterSchema,
  sortDirectionSchema,
  vacancyResponseStatusFilterSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import type { RawResponseBase } from "./types";
import { fetchRelatedData } from "./utils/fetch-related-data";
import { mapResponseData } from "./utils/map-response-data";
import { getFilteredResponseIds } from "./utils/screening-filters";
import { buildOrderByClause, isScoreBasedSort } from "./utils/sort-builder";
import { vacancyResponseSortFieldWorkspaceSchema } from "./utils/sort-types";

const EMPTY_RESULT = {
  responses: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export const listWorkspace = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      page: paginationPageSchema,
      limit: paginationLimitSchema({ default: 20, max: 100 }),
      sortField: vacancyResponseSortFieldWorkspaceSchema,
      sortDirection: sortDirectionSchema,
      screeningFilter: screeningFilterSchema,
      statusFilter: vacancyResponseStatusFilterSchema,
      vacancyIds: z.array(z.string()).optional(),
      search: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const {
      workspaceId,
      page,
      limit,
      sortField,
      sortDirection,
      screeningFilter,
      statusFilter,
      vacancyIds: filterVacancyIds,
      search,
    } = input;
    const offset = (page - 1) * limit;

    const hasAccess = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const workspaceVacancies = await ctx.db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, workspaceId),
      columns: { id: true },
    });

    let vacancyIds = workspaceVacancies.map((v) => v.id);

    if (filterVacancyIds && filterVacancyIds.length > 0) {
      vacancyIds = vacancyIds.filter((id) => filterVacancyIds.includes(id));
    }

    if (vacancyIds.length === 0) {
      return { ...EMPTY_RESULT, page, limit };
    }

    const filteredResponseIds = await getFilteredResponseIds(
      ctx.db,
      vacancyIds,
      screeningFilter,
    );

    if (filteredResponseIds !== null && filteredResponseIds.length === 0) {
      return { ...EMPTY_RESULT, page, limit };
    }

    const whereConditions: SQL[] = [
      eq(responseTable.entityType, "vacancy"),
      inArray(responseTable.entityId, vacancyIds),
    ];

    if (filteredResponseIds !== null) {
      whereConditions.push(inArray(responseTable.id, filteredResponseIds));
    }

    if (search?.trim()) {
      whereConditions.push(
        ilike(responseTable.candidateName, `%${search.trim()}%`),
      );
    }

    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(inArray(responseTable.status, statusFilter));
    }

    const whereCondition = and(...whereConditions);
    const orderByClause = buildOrderByClause(sortField, sortDirection);
    const needsPrioritySort = sortField === "priorityScore";
    const fetchLimit = needsPrioritySort ? Math.min(limit * 3, 300) : limit;

    let responsesRaw: RawResponseBase[];

    if (isScoreBasedSort(sortField)) {
      responsesRaw = (await ctx.db
        .select({
          id: responseTable.id,
          entityId: responseTable.entityId,
          candidateName: responseTable.candidateName,
          photoFileId: responseTable.photoFileId,
          status: responseTable.status,
          hrSelectionStatus: responseTable.hrSelectionStatus,
          contacts: responseTable.contacts,
          profileUrl: responseTable.profileUrl,
          telegramUsername: responseTable.telegramUsername,
          phone: responseTable.phone,
          coverLetter: responseTable.coverLetter,
          respondedAt: responseTable.respondedAt,
          welcomeSentAt: responseTable.welcomeSentAt,
          createdAt: responseTable.createdAt,
        })
        .from(responseTable)
        .leftJoin(
          responseScreening,
          eq(responseTable.id, responseScreening.responseId),
        )
        .where(whereCondition)
        .orderBy(orderByClause)
        .limit(needsPrioritySort ? fetchLimit : limit)
        .offset(needsPrioritySort ? 0 : offset)) as RawResponseBase[];
    } else {
      responsesRaw = (await ctx.db.query.response.findMany({
        where: whereCondition,
        orderBy: [orderByClause],
        limit: needsPrioritySort ? fetchLimit : limit,
        offset: needsPrioritySort ? 0 : offset,
        columns: {
          id: true,
          entityId: true,
          candidateName: true,
          photoFileId: true,
          status: true,
          hrSelectionStatus: true,
          contacts: true,
          profileUrl: true,
          telegramUsername: true,
          phone: true,
          coverLetter: true,
          respondedAt: true,
          welcomeSentAt: true,
          createdAt: true,
        },
      })) as RawResponseBase[];
    }

    const responseIds = responsesRaw.map((r) => r.id);
    const { screenings, interviewScorings, sessions, messageCountsMap } =
      await fetchRelatedData(ctx.db, responseIds);

    const responsesMapped = mapResponseData(
      responsesRaw,
      screenings,
      interviewScorings,
      sessions,
      messageCountsMap,
    );

    if (needsPrioritySort) {
      const totalCountResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(responseTable)
        .where(whereCondition);

      const total = Number(totalCountResult[0]?.count ?? 0);

      const sorted = [...responsesMapped].sort((a, b) => {
        const scoreA = a.priorityScore ?? 0;
        const scoreB = b.priorityScore ?? 0;
        return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });
      const paginatedResponses = sorted.slice(offset, offset + limit);
      return {
        responses: paginatedResponses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    const totalResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(responseTable)
      .where(whereCondition);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      responses: responsesMapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
