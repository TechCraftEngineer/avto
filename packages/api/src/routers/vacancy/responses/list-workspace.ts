import { ORPCError } from "@orpc/server";
import type { SQL } from "@qbs-autonaim/db";
import { and, eq, ilike, inArray, sql } from "@qbs-autonaim/db";
import {
  interviewSession,
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
  evaluatedCount: 0,
  highScoreCount: 0,
  interviewCount: 0,
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
  .handler(async ({ context, input }) => {
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

    const hasAccess = await context.workspaceRepository.checkAccess(
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    const workspaceVacancies = await context.db.query.vacancy.findMany({
      where: and(
        eq(vacancy.workspaceId, workspaceId),
        eq(vacancy.isActive, true),
      ),
      columns: { id: true },
    });

    let vacancyIds = workspaceVacancies.map((v) => v.id);

    if (filterVacancyIds && filterVacancyIds.length > 0) {
      vacancyIds = vacancyIds.filter((id) => filterVacancyIds.includes(id));
    }

    if (vacancyIds.length === 0) {
      return {
        ...EMPTY_RESULT,
        page,
        limit,
      };
    }

    const filteredResponseIds = await getFilteredResponseIds(
      context.db,
      vacancyIds,
      screeningFilter,
    );

    if (filteredResponseIds !== null && filteredResponseIds.length === 0) {
      return {
        ...EMPTY_RESULT,
        page,
        limit,
      };
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

    const [responsesResult, statsResult] = await Promise.all([
      (async () => {
        if (isScoreBasedSort(sortField)) {
          return (await context.db
            .select({
              id: responseTable.id,
              entityId: responseTable.entityId,
              pipelineStageId: responseTable.pipelineStageId,
              candidateName: responseTable.candidateName,
              photoFileId: responseTable.photoFileId,
              birthDate: responseTable.birthDate,
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
        }
        return (await context.db.query.response.findMany({
          where: whereCondition,
          orderBy: [orderByClause],
          limit: needsPrioritySort ? fetchLimit : limit,
          offset: needsPrioritySort ? 0 : offset,
          columns: {
            id: true,
            entityId: true,
            pipelineStageId: true,
            candidateName: true,
            photoFileId: true,
            birthDate: true,
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
      })(),
      context.db
        .select({
          total: sql<number>`count(*)::int`,
          evaluated: sql<number>`count(*) filter (where ${responseScreening.responseId} is not null)::int`,
          highScore: sql<number>`count(*) filter (where ${responseScreening.overallScore} >= 4)::int`,
          interview: sql<number>`count(*) filter (where ${interviewSession.id} is not null)::int`,
        })
        .from(responseTable)
        .leftJoin(
          responseScreening,
          eq(responseTable.id, responseScreening.responseId),
        )
        .leftJoin(
          interviewSession,
          eq(responseTable.id, interviewSession.responseId),
        )
        .where(whereCondition),
    ]);

    const responsesRaw = responsesResult;
    const stats = statsResult[0];

    const responseIds = responsesRaw.map((r) => r.id);
    const { screenings, interviewScorings, sessions, messageCountsMap } =
      await fetchRelatedData(context.db, responseIds);

    const responsesMapped = mapResponseData(
      responsesRaw,
      screenings,
      interviewScorings,
      sessions,
      messageCountsMap,
    );

    const total = stats?.total ?? 0;
    const evaluatedCount = stats?.evaluated ?? 0;
    const highScoreCount = stats?.highScore ?? 0;
    const interviewCount = stats?.interview ?? 0;

    if (needsPrioritySort) {
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
        evaluatedCount,
        highScoreCount,
        interviewCount,
      };
    }

    return {
      responses: responsesMapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      evaluatedCount,
      highScoreCount,
      interviewCount,
    };
  });
