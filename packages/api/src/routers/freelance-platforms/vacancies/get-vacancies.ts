import type { SQL } from "@qbs-autonaim/db";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import {
  paginationLimitSchema,
  paginationPageSchema,
  sortDirectionSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { createErrorHandler } from "../../../utils/error-handler";

const vacancySourceEnum = z.enum([
  "HH",
  "FL_RU",
  "FREELANCE_RU",
  "WEB_LINK",
  "AVITO",
  "SUPERJOB",
  "HABR",
]);

const getVacanciesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  source: vacancySourceEnum.optional(),
  /** "all" | "active" | "inactive" - фильтр по isActive */
  statusFilter: z.enum(["all", "active", "inactive"]).default("all"),
  sortBy: z
    .enum(["createdAt", "title", "responses", "newResponses"])
    .default("createdAt"),
  sortOrder: sortDirectionSchema,
  search: z.string().max(200).optional(),
  dateFrom: z.string().optional(), // ISO date YYYY-MM-DD
  dateTo: z.string().optional(), // ISO date YYYY-MM-DD
  page: paginationPageSchema,
  limit: paginationLimitSchema({ default: 50, max: 200 }),
});

export const getVacancies = protectedProcedure
  .input(getVacanciesInputSchema)
  .query(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверка доступа к workspace
      const access = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!access) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Построение условий фильтрации
      const conditions: Parameters<typeof and>[0][] = [
        eq(vacancy.workspaceId, input.workspaceId),
      ];

      if (input.source) {
        conditions.push(eq(vacancy.source, input.source));
      }
      if (input.statusFilter === "active") {
        conditions.push(eq(vacancy.isActive, true));
      } else if (input.statusFilter === "inactive") {
        conditions.push(eq(vacancy.isActive, false));
      }
      if (input.dateFrom) {
        conditions.push(
          gte(vacancy.createdAt, new Date(`${input.dateFrom}T00:00:00.000Z`)),
        );
      }
      if (input.dateTo) {
        conditions.push(
          lte(vacancy.createdAt, new Date(`${input.dateTo}T23:59:59.999Z`)),
        );
      }
      if (input.search?.trim()) {
        const q = `%${input.search.trim()}%`;
        const searchCond = or(
          ilike(vacancy.title, q),
          ilike(sql`COALESCE(${vacancy.region}, '')`, q),
        );
        if (searchCond) conditions.push(searchCond);
      }

      const whereClause = and(...conditions);

      // Базовый запрос
      const query = ctx.db
        .select({
          id: vacancy.id,
          workspaceId: vacancy.workspaceId,
          title: vacancy.title,
          url: vacancy.url,
          newResponses:
            sql<number>`CAST(COUNT(CASE WHEN ${responseTable.status} = 'NEW' THEN 1 END) AS INTEGER)`.as(
              "newResponses",
            ),
          resumesInProgress: vacancy.resumesInProgress,
          suitableResumes: vacancy.suitableResumes,
          region: vacancy.region,
          workLocation: vacancy.workLocation,
          description: vacancy.description,
          requirements: vacancy.requirements,
          source: vacancy.source,
          externalId: vacancy.externalId,
          customBotInstructions: vacancy.customBotInstructions,
          customScreeningPrompt: vacancy.customScreeningPrompt,
          customInterviewQuestions: vacancy.customInterviewQuestions,
          customOrganizationalQuestions: vacancy.customOrganizationalQuestions,
          isActive: vacancy.isActive,
          isFavorite: vacancy.isFavorite,
          createdAt: vacancy.createdAt,
          updatedAt: vacancy.updatedAt,
          platformUrl: vacancy.url,
          // Статистика по источникам откликов
          hhApiCount: sql<number>`CAST(COUNT(CASE WHEN ${responseTable.importSource} = 'HH' THEN 1 END) AS INTEGER)`,
          freelanceManualCount: sql<number>`CAST(COUNT(CASE WHEN ${responseTable.importSource} = 'MANUAL' THEN 1 END) AS INTEGER)`,
          freelanceLinkCount: sql<number>`CAST(COUNT(CASE WHEN ${responseTable.importSource} = 'WEB_LINK' THEN 1 END) AS INTEGER)`,
          totalResponsesCount: count(responseTable.id),
        })
        .from(vacancy)
        .leftJoin(
          responseTable,
          and(
            eq(vacancy.id, responseTable.entityId),
            eq(responseTable.entityType, "vacancy"),
          ),
        )
        .where(whereClause);

      const sortBy = input.sortBy;
      const sortOrder = input.sortOrder;

      const orderByMapping: {
        readonly createdAt: typeof vacancy.createdAt;
        readonly title: typeof vacancy.title;
        readonly responses: SQL<number>;
        readonly newResponses: SQL<number>;
      } = {
        createdAt: vacancy.createdAt,
        title: vacancy.title,
        responses: count(responseTable.id),
        newResponses: sql<number>`CAST(COUNT(CASE WHEN ${responseTable.status} = 'NEW' THEN 1 END) AS INTEGER)`,
      } as const;

      const orderBy = orderByMapping[sortBy] ?? vacancy.createdAt;
      const offset = (input.page - 1) * input.limit;
      const mainOrder =
        sortOrder === "asc"
          ? (sql`${orderBy} ASC` as SQL)
          : (sql`${orderBy} DESC` as SQL);

      const vacancies = await query
        .groupBy(vacancy.id)
        .orderBy(desc(vacancy.isFavorite), desc(vacancy.isActive), mainOrder)
        .limit(input.limit)
        .offset(offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(vacancy)
        .where(whereClause);

      const total = Number(countResult[0]?.count ?? 0);

      const result: {
        vacancies: typeof vacancies;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        stats?: {
          totalVacancies: number;
          activeVacancies: number;
          totalResponses: number;
          newResponses: number;
        };
      } = {
        vacancies,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };

      // Статистика для первой страницы без фильтров
      const hasNoFilters =
        input.page === 1 &&
        !input.search?.trim() &&
        input.statusFilter === "all" &&
        !input.dateFrom &&
        !input.dateTo &&
        !input.source;

      if (hasNoFilters) {
        const [activeCount, totals] = await Promise.all([
          ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(vacancy)
            .where(
              and(
                eq(vacancy.workspaceId, input.workspaceId),
                eq(vacancy.isActive, true),
              ),
            ),
          ctx.db
            .select({
              totalResponses: sql<number>`COALESCE(SUM(
                (SELECT COUNT(*)::int FROM ${responseTable} r
                 WHERE r.entity_id = ${vacancy.id} AND r.entity_type = 'vacancy')
              ), 0)`,
              newResponses: sql<number>`COALESCE(SUM(
                (SELECT COUNT(*)::int FROM ${responseTable} r
                 WHERE r.entity_id = ${vacancy.id} AND r.entity_type = 'vacancy'
                 AND r.status = 'NEW')
              ), 0)`,
            })
            .from(vacancy)
            .where(eq(vacancy.workspaceId, input.workspaceId)),
        ]);
        result.stats = {
          totalVacancies: total,
          activeVacancies: Number(activeCount[0]?.count ?? 0),
          totalResponses: Number(totals[0]?.totalResponses ?? 0),
          newResponses: Number(totals[0]?.newResponses ?? 0),
        };
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        workspaceId: input.workspaceId,
        operation: "get_vacancies",
      });
    }
  });
