import { phoneSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { publicProcedure } from "../../../orpc";
import { createErrorHandler } from "../../../utils/error-handler";
import { handleGigInterview } from "./handlers/gig-interview";
import { handleVacancyInterview } from "./handlers/vacancy-interview";

const startWebInterviewInputSchema = z.object({
  token: z.string().min(1),
  freelancerInfo: z.object({
    name: z.string().min(1, "Имя обязательно").max(500),
    email: z.email("Некорректный email").optional(),
    platformProfileUrl: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((val) => (val === "" ? undefined : val))
      .refine(
        (url) => {
          if (!url) return true; // Пустое значение допустимо
          // Специальное значение для продолжения интервью
          if (url === "https://continue.interview") return true;
          // Проверяем валидность URL
          try {
            new URL(url);
          } catch {
            return false;
          }
          // Проверяем, что это поддерживаемая платформа
          return /(kwork\.ru|fl\.ru|freelance\.ru|hh\.ru)/i.test(url);
        },
        {
          message: "Некорректный URL профиля платформы",
        },
      ),
    phone: phoneSchema,
    telegram: z.string().max(100).optional(),
  }),
});

export const startWebInterview = publicProcedure
  .input(startWebInterviewInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      undefined,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Ищем токен в универсальной таблице interview_links
      const link = await ctx.db.query.interviewLink.findFirst({
        where: (l, { eq, and }) =>
          and(eq(l.token, input.token), eq(l.isActive, true)),
      });

      if (!link) {
        throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
          token: input.token,
        });
      }

      if (link.expiresAt && link.expiresAt < new Date()) {
        throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
          token: input.token,
        });
      }

      // Обработка по типу сущности
      if (link.entityType === "gig") {
        return await handleGigInterview(
          ctx.db,
          link.entityId,
          input.freelancerInfo,
          errorHandler,
        );
      }

      // Обработка индивидуальной ссылки на отклик
      if (link.entityType === "response") {
        // Получаем отклик чтобы узнать entityId и entityType
        const response = await ctx.db.query.response.findFirst({
          where: (r, { eq }) => eq(r.id, link.entityId),
        });

        if (!response) {
          throw await errorHandler.handleNotFoundError("Отклик", {
            responseId: link.entityId,
          });
        }

        // Перенаправляем на соответствующий обработчик с существующим responseId
        if (response.entityType === "gig") {
          return await handleGigInterview(
            ctx.db,
            response.entityId,
            input.freelancerInfo,
            errorHandler,
            link.entityId, // Передаём responseId
          );
        }

        // По умолчанию vacancy
        return await handleVacancyInterview(
          ctx.db,
          response.entityId,
          input.freelancerInfo,
          errorHandler,
          link.entityId, // Передаём responseId
        );
      }

      // По умолчанию vacancy
      return await handleVacancyInterview(
        ctx.db,
        link.entityId,
        input.freelancerInfo,
        errorHandler,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        token: input.token,
        operation: "start_web_interview",
      });
    }
  });
