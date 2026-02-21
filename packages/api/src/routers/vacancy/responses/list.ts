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
import {
  vacancyResponseSortFieldSchema,
  sortDirectionSchema,
} from "./utils/sort-types";
import { getOrderByClause, needsScoreJoin } from "./utils/sorting";
import { buildWhereConditions } from "./utils/where-conditions";

/** Множитель лимита для клиентской сортировки по priorityScore */
const PRIORITY_SORT_LIMIT_MULTIPLIER = 3;

const statusFilterSchema = z
  .array(z.enum(["NEW", "EVALUATED", "INTERVIEW", "COMPLETED", "SKIPPED"]))
  .optional();

const listInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().min(1),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  sortField: vacancyResponseSortFieldSchema,
  sortDirection: sortDirectionSchema,
  screeningFilter: z
    .enum(["all", "evaluated", "not-evaluated", "high-score", "low-score"])
    .default("all"),
  statusFilter: statusFilterSchema,
  search: z.string().max(200).optional(),
});

/** Формирует пустой ответ пагинации */
function emptyPaginatedResponse(page: number, limit: number) {
  return {
    responses: [] as ReturnType<typeof mapResponsesToOutput>,
    total: 0,
    page,
    limit,
    totalPages: 0,
  };
}

/** Формирует ответ пагинации */
function paginatedResponse(
  responses: ReturnType<typeof mapResponsesToOutput>,
  total: number,
  page: number,
  limit: number,
) {
  return {
    responses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export const list = protectedProcedure
  .input(listInputSchema)
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

    // 1. Проверка доступа к workspace
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

    // 2. Проверка принадлежности вакансии к workspace
    const vacancyExists = await ctx.db.query.vacancy.findFirst({
      where: (v, { and, eq }) =>
        and(eq(v.id, vacancyId), eq(v.workspaceId, workspaceId)),
      columns: { id: true },
    });

    if (!vacancyExists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // 3. Получаем ID откликов с учётом фильтра по скринингу
    const filteredResponseIds = await getFilteredResponseIds(
      ctx.db,
      [vacancyId],
      screeningFilter,
    );

    if (filteredResponseIds !== null && filteredResponseIds.length === 0) {
      return emptyPaginatedResponse(page, limit);
    }

    // 4. Строим условия WHERE
    const whereCondition = buildWhereConditions(
      vacancyId,
      filteredResponseIds,
      search,
      statusFilter,
    );

    // 5. Определяем параметры выборки
    const orderByClause = getOrderByClause(sortField, sortDirection);
    const needsPrioritySort = sortField === "priorityScore";
    const fetchLimit = needsPrioritySort
      ? limit * PRIORITY_SORT_LIMIT_MULTIPLIER
      : limit;
    const fetchOffset = needsPrioritySort ? 0 : offset;

    // 6. Получаем отфильтрованные данные с пагинацией
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

    if (responsesRaw.length === 0) {
      return emptyPaginatedResponse(page, limit);
    }

    // 7. Извлекаем ID для загрузки связанных данных
    const responseIds: string[] = [];
    const globalCandidateIdSet = new Set<string>();

    for (const r of responsesRaw) {
      responseIds.push(r.id);
      if (r.globalCandidateId) {
        globalCandidateIdSet.add(r.globalCandidateId);
      }
    }

    const globalCandidateIds = Array.from(globalCandidateIdSet);

    // 8. Загружаем связанные данные параллельно
    const [globalCandidates, screenings, interviewScorings, sessions] =
      await Promise.all([
        fetchGlobalCandidates(ctx.db, globalCandidateIds),
        fetchScreenings(ctx.db, responseIds),
        fetchInterviewScorings(ctx.db, responseIds),
        fetchInterviewSessions(ctx.db, responseIds),
      ]);

    // 9. Загружаем счётчики сообщений и комментариев параллельно
    const sessionIds = sessions.map((s) => s.id);
    const [messageCountsMap, commentCountsMap] = await Promise.all([
      fetchMessageCounts(ctx.db, sessionIds),
      fetchCommentCounts(ctx.db, responseIds),
    ]);

    // 10. Формируем ответ с маппингом данных
    const responsesMapped = mapResponsesToOutput(
      responsesRaw,
      screenings,
      interviewScorings,
      sessions,
      globalCandidates,
      messageCountsMap,
      commentCountsMap,
    );

    // 11. Клиентская сортировка по priorityScore (вычисляемое поле)
    if (needsPrioritySort) {
      responsesMapped.sort((a, b) => {
        const scoreA = a.priorityScore ?? 0;
        const scoreB = b.priorityScore ?? 0;
        return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });

      const paginatedSlice = responsesMapped.slice(offset, offset + limit);
      return paginatedResponse(
        paginatedSlice,
        responsesMapped.length,
        page,
        limit,
      );
    }

    // 12. Получаем общее количество для пагинации
    const totalResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(responseTable)
      .where(whereCondition);

    const total = Number(totalResult[0]?.count ?? 0);

    return paginatedResponse(responsesMapped, total, page, limit);
  });
