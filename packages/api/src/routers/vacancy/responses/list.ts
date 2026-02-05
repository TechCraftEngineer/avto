import { sql } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { mapResponsesToOutput } from "./mappers/response-mapper";
import {
  fetchCommentCounts,
  fetchGlobalCandidates,
  fetchInterviewScorings,
  fetchInterviewSessions,
  fetchMessageCounts,
  fetchScreenings,
} from "./queries/fetch-related-data";
import {
  fetchResponsesWithoutJoin,
  fetchResponsesWithScoreJoin,
} from "./queries/fetch-responses";
import { getFilteredResponseIds } from "./utils/screening-filters";
import { getOrderByClause, needsScoreJoin } from "./utils/sorting";
import { buildWhereConditions } from "./utils/where-conditions";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      sortField: z
        .enum([
          "createdAt",
          "score",
          "detailedScore",
          "potentialScore",
          "careerTrajectoryScore",
          "priorityScore",
          "salaryExpectationsAmount",
          "compositeScore",
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
      vacancyId,
      page,
      limit,
      sortField,
      sortDirection,
      screeningFilter,
      statusFilter,
      search,
    } = input;
    const offset = (page - 1) * limit;

    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверка принадлежности вакансии к workspace
    const vacancyCheck = await ctx.db.query.vacancy.findFirst({
      where: (v, { and, eq }) =>
        and(eq(v.id, vacancyId), eq(v.workspaceId, workspaceId)),
    });

    if (!vacancyCheck) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Получаем ID откликов с учётом фильтра по скринингу
    const filteredResponseIds = await getFilteredResponseIds(
      ctx.db,
      vacancyId,
      screeningFilter,
    );

    // Если фильтр вернул пустой массив, возвращаем пустой результат
    if (filteredResponseIds !== null && filteredResponseIds.length === 0) {
      console.log(
        "[vacancy.responses.list] No responses match screening filter",
      );
      return {
        responses: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Строим условия WHERE
    const whereCondition = buildWhereConditions(
      vacancyId,
      filteredResponseIds,
      search,
      statusFilter,
    );

    // Определяем сортировку
    const orderByClause = getOrderByClause(sortField, sortDirection);
    const needsPrioritySort = sortField === "priorityScore";
    const fetchLimit = needsPrioritySort ? limit * 3 : limit;
    const fetchOffset = needsPrioritySort ? 0 : offset;

    // Получаем отфильтрованные данные с пагинацией
    const responsesRaw = needsScoreJoin(sortField)
      ? await fetchResponsesWithScoreJoin(
          ctx.db,
          whereCondition,
          orderByClause,
          fetchLimit,
          fetchOffset,
        )
      : await fetchResponsesWithoutJoin(
          ctx.db,
          whereCondition,
          orderByClause,
          fetchLimit,
          fetchOffset,
        );

    // Получаем ID откликов и уникальные globalCandidateId
    const responseIds = responsesRaw.map((r: { id: string }) => r.id);
    const globalCandidateIds = Array.from(
      new Set(
        responsesRaw
          .map((r: { globalCandidateId: string | null }) => r.globalCandidateId)
          .filter((id: string | null): id is string => id !== null),
      ),
    ) as string[];

    // Загружаем связанные данные
    const [globalCandidates, screenings, interviewScorings, sessions] =
      await Promise.all([
        fetchGlobalCandidates(ctx.db, globalCandidateIds),
        fetchScreenings(ctx.db, responseIds),
        fetchInterviewScorings(ctx.db, responseIds),
        fetchInterviewSessions(ctx.db, responseIds),
      ]);

    // Получаем количество сообщений и комментариев
    const sessionIds = sessions.map((s: { id: string }) => s.id);
    const [messageCountsMap, commentCountsMap] = await Promise.all([
      fetchMessageCounts(ctx.db, sessionIds),
      fetchCommentCounts(ctx.db, responseIds),
    ]);

    // Формируем ответ с маппингом данных
    const responsesMapped = mapResponsesToOutput(
      responsesRaw,
      screenings,
      interviewScorings,
      sessions,
      globalCandidates,
      messageCountsMap as Map<string, number>,
      commentCountsMap as Map<string, number>,
    );

    // Сортируем по priorityScore если нужно
    if (needsPrioritySort) {
      const sortedResponses = [...responsesMapped].sort((a, b) => {
        const scoreA = a.priorityScore ?? 0;
        const scoreB = b.priorityScore ?? 0;
        return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });

      const paginatedResponses = sortedResponses.slice(offset, offset + limit);
      const total = sortedResponses.length;

      return {
        responses: paginatedResponses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Получаем общее количество для пагинации
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
