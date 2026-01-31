import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { InterviewLinkGenerator } from "../../../services";
import { publicProcedure } from "../../../trpc";

const getVacancyByTokenInputSchema = z.object({
  token: z.string().min(1),
});

export const getVacancyByToken = publicProcedure
  .input(getVacancyByTokenInputSchema)
  .query(async ({ input, ctx }) => {
    // Валидируем токен через сервис
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.validateLink(input.token);
    if (!interviewLink) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью недействительна или истекла",
      });
    }

    // Получаем вакансию
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: (vacancy, { eq }) => eq(vacancy.id, interviewLink.entityId),
    });

    if (!vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Проверяем, что вакансия активна
    if (!vacancy.isActive) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Вакансия закрыта",
      });
    }

    return {
      vacancy: {
        id: vacancy.id,
        title: vacancy.title,
        description: vacancy.description,
        requirements: vacancy.requirements,
        source: vacancy.source,
      },
      interviewLink: {
        id: interviewLink.id,
        token: interviewLink.token,
      },
    };
  });
