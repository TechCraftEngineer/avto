import type { SQL } from "@qbs-autonaim/db";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  sql,
} from "@qbs-autonaim/db";
import {
  interviewMessage,
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import type {
  HrSelectionStatus,
  ResponseStatus,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { sanitizeHtml } from "../../utils/sanitize-html";

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
      where: and(
        eq(vacancy.id, vacancyId),
        eq(vacancy.workspaceId, workspaceId),
      ),
    });

    if (!vacancyCheck) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Получаем ID откликов с учётом фильтра по скринингу
    let filteredResponseIds: string[] | null = null;

    if (screeningFilter === "evaluated") {
      const screenedResponses = await ctx.db
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
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    } else if (screeningFilter === "not-evaluated") {
      const notEvaluated = await ctx.db
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
      filteredResponseIds = notEvaluated.map((r) => r.id);
    } else if (screeningFilter === "high-score") {
      const screenedResponses = await ctx.db
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
            gte(responseScreening.score, 4),
          ),
        );
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    } else if (screeningFilter === "low-score") {
      const screenedResponses = await ctx.db
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
            lt(responseScreening.score, 4),
          ),
        );
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    }

    // Базовое условие WHERE
    const whereConditions: SQL[] = [
      eq(responseTable.entityType, "vacancy"),
      eq(responseTable.entityId, vacancyId),
    ];
    if (filteredResponseIds !== null) {
      if (filteredResponseIds.length === 0) {
        return {
          responses: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
      whereConditions.push(inArray(responseTable.id, filteredResponseIds));
    }

    // Добавляем поиск по ФИО кандидата
    if (search?.trim()) {
      whereConditions.push(
        ilike(responseTable.candidateName, `%${search.trim()}%`),
      );
    }

    // Добавляем фильтр по статусу
    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(inArray(responseTable.status, statusFilter));
    }

    const whereCondition = and(...whereConditions);

    // Определяем сортировку
    let orderByClause: SQL;
    if (sortField === "createdAt") {
      orderByClause =
        sortDirection === "asc"
          ? asc(responseTable.createdAt)
          : desc(responseTable.createdAt);
    } else if (sortField === "status") {
      orderByClause =
        sortDirection === "asc"
          ? asc(responseTable.status)
          : desc(responseTable.status);
    } else if (sortField === "respondedAt") {
      orderByClause =
        sortDirection === "asc"
          ? asc(responseTable.respondedAt)
          : desc(responseTable.respondedAt);
    } else if (sortField === "priorityScore") {
      // Для сортировки по priorityScore используем вычисление на лету
      // Сортируем после получения данных
      orderByClause = desc(responseTable.createdAt); // Временная сортировка, будет пересортировано позже
    } else if (
      sortField === "score" ||
      sortField === "detailedScore" ||
      sortField === "potentialScore" ||
      sortField === "careerTrajectoryScore"
    ) {
      // Для сортировки по score полям используем LEFT JOIN с responseScreening
      const scoreColumn =
        sortField === "score"
          ? responseScreening.score
          : sortField === "detailedScore"
            ? responseScreening.detailedScore
            : sortField === "potentialScore"
              ? responseScreening.potentialScore
              : responseScreening.careerTrajectoryScore;

      orderByClause =
        sortDirection === "asc"
          ? asc(sql`COALESCE(${scoreColumn}, -1)`)
          : desc(sql`COALESCE(${scoreColumn}, -1)`);
    } else {
      orderByClause = desc(responseTable.createdAt);
    }

    // Вычисляем priorityScore для сортировки (если нужно)
    const needsPrioritySort = sortField === "priorityScore";
    
    // Если нужна сортировка по priorityScore, получаем больше данных для вычисления
    const fetchLimit = needsPrioritySort ? limit * 3 : limit;

    // Получаем отфильтрованные данные с пагинацией
    // Используем select с LEFT JOIN для сортировки по score полям
    let responsesRaw: Array<{
      id: string;
      entityId: string;
      candidateName: string | null;
      photoFileId: string | null;
      status: ResponseStatus;
      hrSelectionStatus: HrSelectionStatus | null;
      contacts: Record<string, unknown> | null;
      experience: string | null;
      profileUrl: string | null;
      resumeUrl: string | null;
      telegramUsername: string | null;
      phone: string | null;
      coverLetter: string | null;
      respondedAt: Date | null;
      welcomeSentAt: Date | null;
      createdAt: Date;
      evaluationReasoning: {
        hardSkills?: { score: number; notes: string };
        softSkills?: { score: number; notes: string };
        cultureFit?: { score: number; notes: string };
        salaryAlignment?: { score: number; notes: string };
      } | null;
      compositeScoreReasoning: string | null;
    }>;
    if (
      sortField === "score" ||
      sortField === "detailedScore" ||
      sortField === "potentialScore" ||
      sortField === "careerTrajectoryScore"
    ) {
      responsesRaw = await ctx.db
        .select({
          id: responseTable.id,
          entityId: responseTable.entityId,
          candidateName: responseTable.candidateName,
          photoFileId: responseTable.photoFileId,
          status: responseTable.status,
          hrSelectionStatus: responseTable.hrSelectionStatus,
          contacts: responseTable.contacts,
          experience: responseTable.experience,
          profileUrl: responseTable.profileUrl,
          resumeUrl: responseTable.resumeUrl,
          telegramUsername: responseTable.telegramUsername,
          phone: responseTable.phone,
          coverLetter: responseTable.coverLetter,
          respondedAt: responseTable.respondedAt,
          welcomeSentAt: responseTable.welcomeSentAt,
          createdAt: responseTable.createdAt,
          // Reasoning fields for explainable AI
          evaluationReasoning: responseTable.evaluationReasoning,
          compositeScoreReasoning: responseTable.compositeScoreReasoning,
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
          experience: true,
          profileUrl: true,
          resumeUrl: true,
          telegramUsername: true,
          phone: true,
          coverLetter: true,
          respondedAt: true,
          welcomeSentAt: true,
          createdAt: true,
          // Reasoning fields for explainable AI
          evaluationReasoning: true,
          compositeScoreReasoning: true,
        },
      });
    }

    // Query related data separately
    const responseIds = responsesRaw.map((r) => r.id);

    const screenings =
      responseIds.length > 0
        ? await ctx.db.query.responseScreening.findMany({
            where: (s, { inArray }) => inArray(s.responseId, responseIds),
            columns: {
              responseId: true,
              score: true,
              detailedScore: true,
              analysis: true,
              potentialScore: true,
              careerTrajectoryScore: true,
              careerTrajectoryType: true,
              hiddenFitIndicators: true,
              potentialAnalysis: true,
              careerTrajectoryAnalysis: true,
              hiddenFitAnalysis: true,
            },
          })
        : [];

    const interviewScorings =
      responseIds.length > 0
        ? await ctx.db.query.interviewScoring.findMany({
            where: (is, { inArray }) => inArray(is.responseId, responseIds),
            columns: {
              responseId: true,
              score: true,
              rating: true,
              analysis: true,
              botUsageDetected: true,
            },
          })
        : [];

    const sessions =
      responseIds.length > 0
        ? await ctx.db.query.interviewSession.findMany({
            where: (s, { inArray }) => inArray(s.responseId, responseIds),
            columns: {
              id: true,
              responseId: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        : [];

    // Получаем количество сообщений для каждой сессии одним запросом
    const sessionIds = sessions.map((s) => s.id);

    let messageCountsMap = new Map<string, number>();
    if (sessionIds.length > 0) {
      const messageCounts = await ctx.db
        .select({
          sessionId: interviewMessage.sessionId,
          count: sql<number>`count(*)::int`,
        })
        .from(interviewMessage)
        .where(inArray(interviewMessage.sessionId, sessionIds))
        .groupBy(interviewMessage.sessionId);

      messageCountsMap = new Map(
        messageCounts.map((mc) => [mc.sessionId, mc.count]),
      );
    }

    // Вычисляем priorityScore для каждого отклика
    const calculatePriorityScore = (
      response: typeof responsesRaw[0],
      screening: typeof screenings[0] | undefined,
    ): number => {
      // Базовый score из fitScore (40%)
      const fitScore = screening?.score ?? 0;
      let priorityScore = fitScore * 0.4;

      // Новизна отклика (20%)
      const now = Date.now();
      const respondedAt = response.respondedAt?.getTime() ?? response.createdAt.getTime();
      const hoursSinceResponse = (now - respondedAt) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 100 - hoursSinceResponse * 2); // Убывает на 2 пункта в час
      priorityScore += freshnessScore * 0.2;

      // Штраф за отсутствие скрининга (20%)
      const screeningBonus = screening ? 50 : 0;
      priorityScore += screeningBonus * 0.2;

      // Бонус за статус (20%)
      let statusBonus = 0;
      if (response.hrSelectionStatus === "RECOMMENDED" || response.hrSelectionStatus === "INVITE") {
        statusBonus = 50;
      } else if (response.status === "EVALUATED") {
        statusBonus = 30;
      }
      priorityScore += statusBonus * 0.2;

      return Math.round(Math.min(100, Math.max(0, priorityScore)));
    };

    // Формируем ответ с количеством сообщений и санитизацией HTML
    const responsesMapped = responsesRaw.map((r) => {
      const screening = screenings.find((s) => s.responseId === r.id);
      const interviewScoring = interviewScorings.find(
        (is) => is.responseId === r.id,
      );
      const session = sessions.find((s) => s.responseId === r.id);
      const priorityScore = calculatePriorityScore(r, screening);

      return {
        ...r,
        experience: r.experience ? sanitizeHtml(r.experience) : null,
        priorityScore,
        screening: screening
          ? {
              score: screening.score,
              detailedScore: screening.detailedScore,
              analysis: screening.analysis
                ? sanitizeHtml(screening.analysis)
                : null,
              potentialScore: screening.potentialScore,
              careerTrajectoryScore: screening.careerTrajectoryScore,
              careerTrajectoryType: screening.careerTrajectoryType,
              hiddenFitIndicators: screening.hiddenFitIndicators,
              potentialAnalysis: screening.potentialAnalysis
                ? sanitizeHtml(screening.potentialAnalysis)
                : null,
              careerTrajectoryAnalysis: screening.careerTrajectoryAnalysis
                ? sanitizeHtml(screening.careerTrajectoryAnalysis)
                : null,
              hiddenFitAnalysis: screening.hiddenFitAnalysis
                ? sanitizeHtml(screening.hiddenFitAnalysis)
                : null,
            }
          : null,
        interviewScoring: interviewScoring
          ? {
              score:
                interviewScoring.rating ??
                Math.round(interviewScoring.score / 20),
              detailedScore: interviewScoring.score,
              analysis: interviewScoring.analysis
                ? sanitizeHtml(interviewScoring.analysis)
                : null,
              botUsageDetected: interviewScoring.botUsageDetected ?? null,
            }
          : null,
        interviewSession: session
          ? {
              id: session.id,
              status: session.status,
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
              messageCount: messageCountsMap.get(session.id) || 0,
            }
          : null,
      };
    });

    // Сортируем по priorityScore если нужно
    let responses = responsesMapped;
    if (needsPrioritySort) {
      responses = [...responsesMapped].sort((a, b) => {
        const scoreA = a.priorityScore ?? 0;
        const scoreB = b.priorityScore ?? 0;
        return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });
      // Применяем пагинацию после сортировки
      const paginatedResponses = responses.slice(offset, offset + limit);
      // Обновляем total для правильной пагинации
      const total = responses.length;
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
      responses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
