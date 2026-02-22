import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../../orpc";

const getVacancyByTokenInputSchema = z.object({
  token: z.string().min(1),
});

export const getVacancyByToken = publicProcedure
  .input(getVacancyByTokenInputSchema)
  .handler(async ({ input, context }) => {
    // Валидируем токен через сервис
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.validateLink(input.token);
    if (!interviewLink) {
      throw new ORPCError("NOT_FOUND", { message: "Ссылка на интервью недействительна или истекла", });
    }

    // Получаем вакансию
    const vacancy = await context.db.query.vacancy.findFirst({
      where: (vacancy, { eq }) => eq(vacancy.id, interviewLink.entityId),
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена", });
    }

    // Проверяем, что вакансия активна
    if (!vacancy.isActive) {
      throw new ORPCError("BAD_REQUEST", { message: "Вакансия закрыта", });
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
