import type { SQL } from "@qbs-autonaim/db";
import { and, eq, ilike, inArray, sql } from "@qbs-autonaim/db";
import type {
  HrSelectionStatus,
  ResponseStatus,
} from "@qbs-autonaim/db/schema";
import {
  response as responseTable,
  responseScreening,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { fetchRelatedData } from "./utils/fetch-related-data";
import { mapResponseData } from "./utils/map-response-data";
import { getFilteredResponseIds } from "./utils/screening-filters";
import { buildOrderByClause, isScoreBasedSort } from "./utils/sort-builder";

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
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      sortField: z
        .enum([
          "createdAt",
          "score",
          "detailedScore",
          "potentialScore",
          "careerTrajectoryScore",
          "priorityScore",
          "status",
          "respondedAt",
        ])
        .optional()
        .nullable()
        .default(null),
      sortDirection: z.enum(["asc", "desc"]).default("desc"),
      screeningFilter: z
        .enum(["all", "evaluated", "not-evaluated", "high-score", "low-score"])
        .default("all"),
      statusFilter: z
        .array(
          z.enum(["NEW", "EVALUATED", "INTERVIEW", "COMPLETED", "SKIPPED"]),
        )
        .optional(),
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
      search,
    } = input;
    const offset = (page - 1) * limit;

    const hasAccess = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const workspaceVacancies = await ctx.db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, workspaceId),
      columns: { id: true },
    });

    const vacancyIds = workspaceVacancies.map((v) => v.id);

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

    let responsesRaw: Array<{
      id: string;
      entityId: string;
      candidateName: string | null;
      photoFileId: string | null;
      status: ResponseStatus;
      hrSelectionStatus: HrSelectionStatus | null;
      contacts: Record<string, unknown> | null;
      profileUrl: string | null;
      resumeUrl: string | null;
      telegramUsername: string | null;
      phone: string | null;
      coverLetter: string | null;
      respondedAt: Date | null;
      welcomeSentAt: Date | null;
      createdAt: Date;
    }>;

    if (isScoreBasedSort(sortField)) {
      responsesRaw = await ctx.db
        .select({
          id: responseTable.id,
          entityId: responseTable.entityId,
          candidateName: responseTable.candidateName,
          photoFileId: responseTable.photoFileId,
          status: responseTable.status,
          hrSelectionStatus: responseTable.hrSelectionStatus,
          contacts: responseTable.contacts,
          profileUrl: responseTable.profileUrl,
          resumeUrl: responseTable.resumeUrl,
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
        .offset(needsPrioritySort ? 0 : offset);
    } else {
      responsesRaw = await ctx.db.query.response.findMany({
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
          resumeUrl: true,
          telegramUsername: true,
          phone: true,
          coverLetter: true,
          respondedAt: true,
          welcomeSentAt: true,
          createdAt: true,
        },
      });
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
      const sorted = [...responsesMapped].sort((a, b) => {
        const scoreA = a.priorityScore ?? 0;
        const scoreB = b.priorityScore ?? 0;
        return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });
      const paginatedResponses = sorted.slice(offset, offset + limit);
      return {
        responses: paginatedResponses,
        total: sorted.length,
        page,
        limit,
        totalPages: Math.ceil(sorted.length / limit),
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
