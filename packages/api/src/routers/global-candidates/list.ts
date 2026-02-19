import {
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "@qbs-autonaim/db";
import {
  candidateOrganization,
  globalCandidate,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

/** lastActivity: MAX(ответы) или updated_at связи */
function lastActivityExpr() {
  return sql`COALESCE(
    (SELECT MAX(r.updated_at) FROM responses r
     WHERE r.global_candidate_id = ${globalCandidate.id} AND r.entity_type = 'vacancy'),
    ${candidateOrganization.updatedAt}
  )`;
}

export const list = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      limit: z.number().int().min(1).max(200).default(50),
      cursor: uuidv7Schema.optional(),
      search: z.string().optional(),
      status: z.array(z.enum(["ACTIVE", "BLACKLISTED", "HIRED"])).optional(),
      vacancyId: z.string().optional(),
      skills: z.array(z.string()).optional(),
      sortBy: z
        .enum(["createdAt", "updatedAt", "fullName", "lastActivity"])
        .default("updatedAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      lastActivityFrom: z.coerce.date().optional(),
      lastActivityTo: z.coerce.date().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    // Проверяем доступ к организации
    const hasAccess = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Базовые условия: фильтр по организации
    const conditions: SQL<unknown>[] = [
      eq(candidateOrganization.organizationId, input.organizationId),
    ];

    // Фильтр по статусу
    if (input.status && input.status.length > 0) {
      conditions.push(inArray(candidateOrganization.status, input.status));
    }

    // Поиск по имени, email, телефону, telegram (JOIN с global_candidates)
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
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Фильтр по навыкам (JSONB contains)
    if (input.skills && input.skills.length > 0) {
      const skillsConditions = input.skills.map(
        (skill) =>
          sql`${globalCandidate.skills}::jsonb @> ${JSON.stringify([skill])}::jsonb`,
      );
      const skillsCondition = or(...skillsConditions);
      if (skillsCondition) {
        conditions.push(skillsCondition);
      }
    }

    // Фильтр по вакансии (EXISTS: кандидат должен иметь отклик на эту вакансию)
    if (input.vacancyId) {
      conditions.push(
        exists(
          ctx.db
            .select({ one: sql`1` })
            .from(responseTable)
            .where(
              and(
                eq(responseTable.globalCandidateId, globalCandidate.id),
                eq(responseTable.entityType, "vacancy"),
                eq(responseTable.entityId, input.vacancyId),
              ),
            ),
        ),
      );
    }

    // Фильтр по дате последней активности
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

    // Курсор для пагинации (cursor-based по id связи)
    if (input.cursor) {
      conditions.push(lt(candidateOrganization.id, input.cursor));
    }

    // Выбор колонки для сортировки
    const orderDir = input.sortOrder === "asc" ? asc : desc;
    const orderBy =
      input.sortBy === "createdAt"
        ? [
            orderDir(candidateOrganization.createdAt),
            desc(candidateOrganization.id),
          ]
        : input.sortBy === "updatedAt"
          ? [
              orderDir(candidateOrganization.updatedAt),
              desc(candidateOrganization.id),
            ]
          : input.sortBy === "fullName"
            ? [
                orderDir(globalCandidate.fullName),
                desc(candidateOrganization.id),
              ]
            : [orderDir(lastActivityExpr()), desc(candidateOrganization.id)];

    // Запрос с JOIN: candidate_organization + global_candidates
    const candidateLinks = await ctx.db
      .select({
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
      })
      .from(candidateOrganization)
      .innerJoin(
        globalCandidate,
        eq(candidateOrganization.candidateId, globalCandidate.id),
      )
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(input.limit + 1);

    // Пагинация
    let nextCursor: string | undefined;
    if (candidateLinks.length > input.limit) {
      candidateLinks.pop();
      nextCursor = candidateLinks[candidateLinks.length - 1]?.id;
    }

    if (candidateLinks.length === 0) {
      // Подсчёт total с теми же фильтрами
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(candidateOrganization)
        .innerJoin(
          globalCandidate,
          eq(candidateOrganization.candidateId, globalCandidate.id),
        )
        .where(
          and(
            eq(candidateOrganization.organizationId, input.organizationId),
            ...(input.status?.length
              ? [inArray(candidateOrganization.status, input.status)]
              : []),
            ...(input.search
              ? [
                  or(
                    ilike(globalCandidate.fullName, `%${input.search}%`),
                    ilike(globalCandidate.email, `%${input.search}%`),
                    ilike(globalCandidate.phone, `%${input.search}%`),
                    ilike(
                      globalCandidate.telegramUsername,
                      `%${input.search}%`,
                    ),
                    ilike(globalCandidate.headline, `%${input.search}%`),
                    ilike(globalCandidate.location, `%${input.search}%`),
                  ),
                ]
              : []),
            ...(input.skills?.length
              ? [
                  or(
                    ...input.skills.map(
                      (skill) =>
                        sql`${globalCandidate.skills}::jsonb @> ${JSON.stringify([skill])}::jsonb`,
                    ),
                  ),
                ]
              : []),
            ...(input.vacancyId
              ? [
                  exists(
                    ctx.db
                      .select({ one: sql`1` })
                      .from(responseTable)
                      .where(
                        and(
                          eq(
                            responseTable.globalCandidateId,
                            globalCandidate.id,
                          ),
                          eq(responseTable.entityType, "vacancy"),
                          eq(responseTable.entityId, input.vacancyId),
                        ),
                      ),
                  ),
                ]
              : []),
            ...(input.lastActivityFrom
              ? [
                  gte(
                    lastActivityExpr(),
                    sql`${input.lastActivityFrom.toISOString()}::timestamptz`,
                  ),
                ]
              : []),
            ...(input.lastActivityTo
              ? [
                  lte(
                    lastActivityExpr(),
                    sql`${input.lastActivityTo.toISOString()}::timestamptz`,
                  ),
                ]
              : []),
          ),
        );

      return {
        items: [],
        nextCursor: undefined,
        total: totalResult[0]?.count ?? 0,
      };
    }

    const candidateIds = candidateLinks.map((l) => l.candidateId);

    // Получаем отклики для lastActivity и relatedVacancies
    const responses = await ctx.db.query.response.findMany({
      where: and(
        inArray(responseTable.globalCandidateId, candidateIds),
        eq(responseTable.entityType, "vacancy"),
      ),
      with: {
        vacancy: {
          columns: { id: true, title: true },
        },
      },
      orderBy: [desc(responseTable.updatedAt)],
    });

    const responsesByCandidate = new Map<string, typeof responses>();
    for (const r of responses) {
      if (r.globalCandidateId) {
        const existing = responsesByCandidate.get(r.globalCandidateId) || [];
        existing.push(r);
        responsesByCandidate.set(r.globalCandidateId, existing);
      }
    }

    const items = candidateLinks.map((link) => {
      const candidateResponses =
        responsesByCandidate.get(link.candidateId) || [];
      const lastActivity = candidateResponses[0]?.updatedAt ?? link.updatedAt;
      const relatedVacancies = [
        ...new Set(
          candidateResponses
            .map((r) => r.vacancy?.title)
            .filter((v): v is string => !!v),
        ),
      ];

      return {
        id: link.candidateId,
        linkId: link.id,
        fullName: link.fullName || "Неизвестный кандидат",
        firstName: link.firstName,
        lastName: link.lastName,
        middleName: link.middleName,
        headline: link.headline,
        email: link.email,
        phone: link.phone,
        telegramUsername: link.telegramUsername,
        location: link.location,
        skills: link.skills || [],
        experienceYears: link.experienceYears,
        salaryExpectationsAmount: link.salaryExpectationsAmount,
        workFormat: link.workFormat,
        englishLevel: link.englishLevel,
        readyForRelocation: link.readyForRelocation,
        avatarFileId: link.photoFileId ?? null,
        status: link.status,
        tags: link.tags || [],
        notes: link.notes,
        source: link.source,
        originalSource: link.originalSource,
        resumeUrl: link.resumeUrl,
        relatedVacancies,
        lastActivity,
        appliedAt: link.appliedAt,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        globalCandidateId: link.candidateId,
      };
    });

    // Подсчёт total с учётом всех фильтров
    const totalConditions: SQL<unknown>[] = [
      eq(candidateOrganization.organizationId, input.organizationId),
    ];
    if (input.status?.length) {
      totalConditions.push(inArray(candidateOrganization.status, input.status));
    }
    if (input.search) {
      const sp = `%${input.search}%`;
      const searchCond = or(
        ilike(globalCandidate.fullName, sp),
        ilike(globalCandidate.email, sp),
        ilike(globalCandidate.phone, sp),
        ilike(globalCandidate.telegramUsername, sp),
        ilike(globalCandidate.headline, sp),
        ilike(globalCandidate.location, sp),
      );
      if (searchCond) totalConditions.push(searchCond);
    }
    if (input.skills?.length) {
      const skillsCond = or(
        ...input.skills.map(
          (skill) =>
            sql`${globalCandidate.skills}::jsonb @> ${JSON.stringify([skill])}::jsonb`,
        ),
      );
      if (skillsCond) totalConditions.push(skillsCond);
    }
    if (input.vacancyId) {
      totalConditions.push(
        exists(
          ctx.db
            .select({ one: sql`1` })
            .from(responseTable)
            .where(
              and(
                eq(responseTable.globalCandidateId, globalCandidate.id),
                eq(responseTable.entityType, "vacancy"),
                eq(responseTable.entityId, input.vacancyId),
              ),
            ),
        ),
      );
    }
    if (input.lastActivityFrom) {
      totalConditions.push(
        gte(
          lastActivityExpr(),
          sql`${input.lastActivityFrom.toISOString()}::timestamptz`,
        ),
      );
    }
    if (input.lastActivityTo) {
      totalConditions.push(
        lte(
          lastActivityExpr(),
          sql`${input.lastActivityTo.toISOString()}::timestamptz`,
        ),
      );
    }

    const totalResult = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(candidateOrganization)
      .innerJoin(
        globalCandidate,
        eq(candidateOrganization.candidateId, globalCandidate.id),
      )
      .where(and(...totalConditions));

    return {
      items,
      nextCursor,
      total: totalResult[0]?.count ?? 0,
    };
  });
