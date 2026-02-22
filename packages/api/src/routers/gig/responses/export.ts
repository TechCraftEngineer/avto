import { and, desc, eq } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const exportResponses = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace", });
    }

    // Проверяем что gig принадлежит workspace
    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("NOT_FOUND", { message: "Задание не найдено", });
    }

    // Получаем все отклики
    const responses = await context.db.query.response.findMany({
      where: and(
        eq(responseTable.entityType, "gig"),
        eq(responseTable.entityId, input.gigId),
      ),
      with: {
        screening: true,
        interviewScoring: true,
      },
      orderBy: [desc(responseTable.createdAt)],
    });

    // Формируем CSV данные
    const csvRows = responses.map((response) => ({
      id: response.id,
      candidateName: response.candidateName || "",
      candidateId: response.candidateId,
      status: response.status,
      hrSelectionStatus: response.hrSelectionStatus || "",
      proposedPrice: response.proposedPrice || "",
      proposedDeliveryDays: response.proposedDeliveryDays || "",
      coverLetter: response.coverLetter || "",
      screeningScore: response.screening?.overallScore || "",
      screeningAnalysis: response.screening?.overallAnalysis || "",
      interviewScore: response.interviewScoring?.score || "",
      interviewRating: response.interviewScoring?.rating || "",
      createdAt: response.createdAt
        ? new Date(response.createdAt).toLocaleString("ru-RU")
        : "",
    }));

    // Заголовки CSV
    const headers = [
      "ID",
      "Имя кандидата",
      "ID кандидата",
      "Статус",
      "HR статус",
      "Предложенная цена",
      "Срок (дней)",
      "Сопроводительное письмо",
      "Оценка скрининга",
      "Анализ скрининга",
      "Оценка интервью",
      "Рейтинг интервью",
      "Дата отклика",
    ];

    return {
      gigTitle: existingGig.title,
      totalCount: responses.length,
      headers,
      rows: csvRows,
    };
  });
