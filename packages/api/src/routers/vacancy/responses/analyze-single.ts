import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const analyzeSingle = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      workspaceId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { responseId, workspaceId } = input;

    // Проверяем существование отклика
    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден",
      });
    }

    // Проверяем доступ через вакансию
    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия для отклика не найдена",
      });
    }

    if (vacancy.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому отклику",
      });
    }

    // Отправляем событие в Inngest для анализа
    await context.inngest.send({
      name: "response/analyze.single",
      data: {
        responseId,
      },
    });

    return { success: true };
  });
