import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const refreshResume = protectedProcedure
  .input(
    z.object({
      candidateId: z.uuid(),
      workspaceId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { candidateId, workspaceId } = input;

    const candidate = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!candidate) {
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден", });
    }

    // Query vacancy separately using entityId
    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, candidate.entityId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия для кандидата не найдена", });
    }

    if (vacancy.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому кандидату", });
    }

    // Отправляем событие в Inngest для обновления резюме
    await context.inngest.send({
      name: "response/resume.refresh",
      data: {
        responseId: candidateId,
      },
    });

    return { success: true };
  });
