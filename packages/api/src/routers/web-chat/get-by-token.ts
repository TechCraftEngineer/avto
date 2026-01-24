import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const getWebChatByTokenInputSchema = z.object({
  token: z.string().min(1),
});

/**
 * Универсальный эндпоинт для получения данных веб-чата по токену.
 * Ищет токен в таблице web_chat_links и возвращает
 * тип сущности, данные сущности и информацию о кандидате (если есть responseId).
 */
export const getWebChatByToken = publicProcedure
  .input(getWebChatByTokenInputSchema)
  .query(async ({ input, ctx }) => {
    // Ищем в таблице web_chat_links
    const link = await ctx.db.query.webChatLink.findFirst({
      where: (l, { eq, and }) => and(eq(l.token, input.token), eq(l.isActive, true)),
    });

    if (!link) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на веб-чат недействительна или истекла",
      });
    }

    // Проверяем срок действия
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на веб-чат истекла",
      });
    }

    // Обработка по типу сущности
    let entityData;

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

      if (!foundGig.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Задание закрыто",
        });
      }

      entityData = {
        id: foundGig.id,
        title: foundGig.title,
        description: foundGig.description,
        requirements: foundGig.requirements,
        source: foundGig.source,
      };
    } else if (link.entityType === "vacancy") {
      // Получаем вакансию
      const foundVacancy = await ctx.db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, link.entityId),
      });

      if (!foundVacancy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Вакансия не найдена",
        });
      }

      if (!foundVacancy.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Вакансия закрыта",
        });
      }

      entityData = {
        id: foundVacancy.id,
        title: foundVacancy.title,
        description: foundVacancy.description,
        requirements: foundVacancy.requirements,
      };
    } else {
      // Для project (поддерживаем в будущем)
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Тип сущности не поддерживается",
      });
    }

    // Если есть responseId, получаем данные кандидата
    let candidateData = null;
    if (link.responseId) {
      const responseData = await ctx.db.query.response.findFirst({
        where: (r, { eq }) => eq(r.id, link.responseId as string),
      });

      if (responseData) {
        candidateData = {
          id: responseData.id,
          candidateId: responseData.candidateId,
          candidateName: responseData.candidateName,
          email: responseData.email,
          phone: responseData.phone,
          telegramUsername: responseData.telegramUsername,
          coverLetter: responseData.coverLetter,
          salaryExpectationsAmount: responseData.salaryExpectationsAmount,
        };
      }
    }

    return {
      type: link.entityType,
      webChatLink: {
        id: link.id,
        token: link.token,
        entityType: link.entityType,
        entityId: link.entityId,
        responseId: link.responseId,
        isActive: link.isActive,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        metadata: link.metadata,
      },
      entityData,
      candidateData,
    };
  });
