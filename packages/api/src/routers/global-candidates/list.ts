import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  lt,
  or,
  type SQL,
  sql,
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

    // Поиск по имени, email, телефону, telegram
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
      // Используем JSONB оператор для поиска навыков
      const skillsConditions = input.skills.map(
        (skill) =>
          sql`${globalCandidate.skills}::jsonb @> ${JSON.stringify([skill])}::jsonb`,
      );
      const skillsCondition = or(...skillsConditions);
      if (skillsCondition) {
        conditions.push(skillsCondition);
      }
    }

    // Курсор для пагинации
    if (input.cursor) {
      conditions.push(lt(candidateOrganization.id, input.cursor));
    }

    // Получаем связи кандидатов с организацией
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
      })
      .from(candidateOrganization)
      .where(and(...conditions))
      .orderBy(desc(candidateOrganization.updatedAt))
      .limit(input.limit + 1);

    // Пагинация
    let nextCursor: string | undefined;
    if (candidateLinks.length > input.limit) {
      candidateLinks.pop();
      nextCursor = candidateLinks[candidateLinks.length - 1]?.id;
    }

    if (candidateLinks.length === 0) {
      return {
        items: [],
        nextCursor: undefined,
        total: 0,
      };
    }

    // Получаем данные глобальных кандидатов
    const candidateIds = candidateLinks.map((link) => link.candidateId);
    const candidates = await ctx.db.query.globalCandidate.findMany({
      where: inArray(globalCandidate.id, candidateIds),
    });

    const candidatesMap = new Map(candidates.map((c) => [c.id, c]));

    // Получаем отклики кандидатов для определения последней активности и вакансий
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

    // Группируем отклики по кандидатам
    const responsesByCandidate = new Map<string, typeof responses>();
    for (const response of responses) {
      if (response.globalCandidateId) {
        const existing =
          responsesByCandidate.get(response.globalCandidateId) || [];
        existing.push(response);
        responsesByCandidate.set(response.globalCandidateId, existing);
      }
    }

    // Фильтр по вакансии (после получения данных)
    let filteredLinks = candidateLinks;
    if (input.vacancyId) {
      filteredLinks = candidateLinks.filter((link) => {
        const candidateResponses =
          responsesByCandidate.get(link.candidateId) || [];
        return candidateResponses.some((r) => r.entityId === input.vacancyId);
      });
    }

    // Фильтр по дате последней активности
    if (input.lastActivityFrom || input.lastActivityTo) {
      filteredLinks = filteredLinks.filter((link) => {
        const candidateResponses =
          responsesByCandidate.get(link.candidateId) || [];
        const lastActivity = candidateResponses[0]?.updatedAt || link.updatedAt;

        if (input.lastActivityFrom && lastActivity < input.lastActivityFrom) {
          return false;
        }
        if (input.lastActivityTo && lastActivity > input.lastActivityTo) {
          return false;
        }
        return true;
      });
    }

    // Формируем итоговый список
    const items = filteredLinks.map((link) => {
      const candidate = candidatesMap.get(link.candidateId);
      const candidateResponses =
        responsesByCandidate.get(link.candidateId) || [];

      // Последняя активность
      const lastActivity = candidateResponses[0]?.updatedAt || link.updatedAt;

      // Связанные вакансии
      const relatedVacancies = [
        ...new Set(
          candidateResponses
            .map((r) => r.vacancy?.title)
            .filter((v): v is string => !!v),
        ),
      ];

      // Фотография
      const avatarFileId = candidate?.photoFileId ?? null;

      return {
        id: link.candidateId,
        linkId: link.id,
        fullName: candidate?.fullName || "Неизвестный кандидат",
        firstName: candidate?.firstName,
        lastName: candidate?.lastName,
        middleName: candidate?.middleName,
        headline: candidate?.headline,
        email: candidate?.email,
        phone: candidate?.phone,
        telegramUsername: candidate?.telegramUsername,
        location: candidate?.location,
        skills: candidate?.skills || [],
        experienceYears: candidate?.experienceYears,
        salaryExpectationsAmount: candidate?.salaryExpectationsAmount,
        workFormat: candidate?.workFormat,
        englishLevel: candidate?.englishLevel,
        readyForRelocation: candidate?.readyForRelocation,
        avatarFileId,
        status: link.status,
        tags: link.tags || [],
        notes: link.notes,
        source: candidate?.source,
        originalSource: candidate?.originalSource,
        resumeUrl: candidate?.resumeUrl,
        relatedVacancies,
        lastActivity,
        appliedAt: link.appliedAt,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        globalCandidateId: candidate?.id,
      };
    });

    // Подсчет общего количества
    const totalCount = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(candidateOrganization)
      .where(eq(candidateOrganization.organizationId, input.organizationId));

    return {
      items,
      nextCursor,
      total: totalCount[0]?.count || 0,
    };
  });
