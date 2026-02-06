import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../../trpc";

const getInterviewByTokenInputSchema = z.object({
  token: z.string().min(1),
});

/**
 * Универсальный эндпоинт для получения данных интервью по токену.
 * Ищет токен в таблице interview_links и возвращает
 * тип сущности (vacancy | gig) и соответствующие данные.
 */
export const getInterviewByToken = publicProcedure
  .input(getInterviewByTokenInputSchema)
  .query(async ({ input, ctx }) => {
    // Ищем в универсальной таблице interview_links
    const link = await ctx.db.query.interviewLink.findFirst({
      where: (l, { eq, and }) =>
        and(eq(l.token, input.token), eq(l.isActive, true)),
    });

    if (!link) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью недействительна или истекла",
      });
    }

    // Проверяем срок действия
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью истекла",
      });
    }

    // Обработка по типу сущности
    if (link.entityType === "gig") {
      // Получаем гиг
      const foundGig = await ctx.db.query.gig.findFirst({
        where: (g, { eq }) => eq(g.id, link.entityId),
      });

      if (!foundGig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Задание не найдено",
        });
      }

      return {
        type: "gig" as const,
        isActive: foundGig.isActive,
        interviewLink: {
          id: link.id,
          token: link.token,
        },
        data: {
          id: foundGig.id,
          title: foundGig.title,
          description: foundGig.description,
          requirements: foundGig.requirements,
          source: foundGig.source,
        },
      };
    }

    // Обработка индивидуальной ссылки на отклик
    if (link.entityType === "response") {
      // Получаем отклик с связанной сессией интервью
      const foundResponse = await ctx.db.query.response.findFirst({
        where: (r, { eq }) => eq(r.id, link.entityId),
        with: {
          interviewSessions: {
            where: (s, { eq }) => eq(s.status, "active"),
            limit: 1,
          },
        },
      });

      if (!foundResponse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Отклик не найден",
        });
      }

      // Получаем данные вакансии/гига и проверяем статус
      let isActive = true;
      let title = "";
      let source = "direct_link";

      if (foundResponse.entityType === "vacancy") {
        const vacancy = await ctx.db.query.vacancy.findFirst({
          where: (v, { eq }) => eq(v.id, foundResponse.entityId),
        });
        isActive = vacancy?.isActive ?? false;
        title = vacancy?.title ?? "Вакансия";
        source = vacancy?.source ?? "direct_link";
      } else if (foundResponse.entityType === "gig") {
        const gig = await ctx.db.query.gig.findFirst({
          where: (g, { eq }) => eq(g.id, foundResponse.entityId),
        });
        isActive = gig?.isActive ?? false;
        title = gig?.title ?? "Задание";
        source = gig?.source ?? "direct_link";
      }

      const activeSession = foundResponse.interviewSessions?.[0];

      return {
        type: "direct_response" as const,
        isActive,
        responseId: foundResponse.id,
        sessionId: activeSession?.id,
        hasActiveSession: !!activeSession,
        interviewLink: {
          id: link.id,
          token: link.token,
        },
        data: {
          id: foundResponse.entityId,
          title,
          source,
        },
      };
    }

    // Обработка vacancy (по умолчанию)
    const foundVacancy = await ctx.db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, link.entityId),
    });

    if (!foundVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    return {
      type: "vacancy" as const,
      isActive: foundVacancy.isActive,
      interviewLink: {
        id: link.id,
        token: link.token,
      },
      data: {
        id: foundVacancy.id,
        title: foundVacancy.title,
        description: foundVacancy.description,
        requirements: foundVacancy.requirements,
        source: foundVacancy.source,
      },
    };
  });
