import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import { vacancy as vacancyTable } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { withInterviewAccess } from "../../../utils/interview-access-middleware";

const getInterviewContextInputSchema = z.object({
  interviewSessionId: z.uuid().optional(),
  sessionId: z.uuid().optional(),
  interviewToken: z.string().optional(),
});

export const getInterviewContext = withInterviewAccess.handler(
  async ({ context }) => {
    // Type assertion для расширенного контекста
    const extendedContext = context as typeof context & {
      verifiedInterviewSessionId: string;
      validatedInterviewToken: string | null;
    };

    // Доступ уже проверен в middleware

    const session = await context.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, extendedContext.verifiedInterviewSessionId),
      with: {
        response: true,
      },
    });

    if (!session || !session.response) {
      throw new ORPCError("NOT_FOUND", { message: "Интервью не найдено" });
    }

    // Определяем тип сущности и загружаем соответствующие данные
    if (session.response.entityType === "vacancy") {
      const vacancy = await context.db.query.vacancy.findFirst({
        where: eq(vacancyTable.id, session.response.entityId),
      });

      if (vacancy) {
        return {
          type: "vacancy" as const,
          title: vacancy.title,
          description: vacancy.description,
          requirements: vacancy.requirements,
          customInterviewQuestions: vacancy.customInterviewQuestions,
        };
      }
    }

    // Если это интервью по гигу
    if (session.response.entityType === "gig") {
      const gig = await context.db.query.gig.findFirst({
        where: (g, { eq }) => eq(g.id, session.response.entityId),
      });

      if (gig) {
        return {
          type: "gig" as const,
          title: gig.title,
          description: gig.description,
          requirements: gig.requirements,
          gigType: gig.type,
          budget:
            gig.budgetMin || gig.budgetMax
              ? {
                  min: gig.budgetMin,
                  max: gig.budgetMax,
                  currency: "₽",
                }
              : null,
          deadline: gig.deadline,
          estimatedDuration: gig.estimatedDuration,
          customInterviewQuestions: gig.customInterviewQuestions,
        };
      }
    }

    throw new ORPCError("NOT_FOUND", {
      message: "Информация о вакансии или задании не найдена",
    });
  },
);
