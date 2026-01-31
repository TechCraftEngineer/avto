import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { InterviewLinkGenerator } from "../../../services";
import { publicProcedure } from "../../../trpc";

const platformProfileUrlSchema = z
  .string()
  .min(1, "URL профиля обязателен")
  .regex(
    /(kwork\.ru|fl\.ru|freelance\.ru)/i,
    "Некорректный URL профиля платформы",
  );

const startInterviewInputSchema = z.object({
  token: z.uuid(),
  freelancerInfo: z.object({
    name: z.string().min(1, "Имя обязательно").max(500),
    email: z.email("Некорректный email"),
    platformProfileUrl: platformProfileUrlSchema,
    phone: z.string().max(50).optional(),
    telegram: z.string().max(100).optional(),
  }),
});

export const startInterview = publicProcedure
  .input(startInterviewInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Валидируем токен
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.validateLink(input.token);

    if (!interviewLink) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью недействительна или истекла",
      });
    }

    // Проверяем, что вакансия активна
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: (vacancy, { eq }) => eq(vacancy.id, interviewLink.entityId),
    });

    if (!vacancy || !vacancy.isActive) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Вакансия закрыта",
      });
    }

    // Проверяем дубликаты по platformProfileUrl + vacancyId
    const existingResponse = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.entityId, interviewLink.entityId),
        eq(responseTable.entityType, "vacancy"),
        eq(responseTable.profileUrl, input.freelancerInfo.platformProfileUrl),
      ),
    });

    if (existingResponse) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Вы уже откликнулись на эту вакансию",
      });
    }

    // Создаём отклик
    const [response] = await ctx.db
      .insert(responseTable)
      .values({
        entityId: interviewLink.entityId,
        entityType: "vacancy",
        candidateId: input.freelancerInfo.platformProfileUrl,
        candidateName: input.freelancerInfo.name,
        profileUrl: input.freelancerInfo.platformProfileUrl,
        phone: input.freelancerInfo.phone,
        telegramUsername: input.freelancerInfo.telegram,
        contacts: {
          email: input.freelancerInfo.email,
          phone: input.freelancerInfo.phone,
          telegram: input.freelancerInfo.telegram,
        },
        importSource: "WEB_LINK",
        status: "NEW",
        respondedAt: new Date(),
      })
      .returning();

    if (!response) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать отклик",
      });
    }

    return {
      responseId: response.id,
      vacancyId: response.entityId,
    };
  });
