import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const sendByUsername = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      username: z.string().min(1, "Username обязателен"),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const { responseId, username, workspaceId } = input;

    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем, что отклик существует
    const response = await context.db.query.response.findFirst({
      where: eq(responseTable.id, responseId),
    });

    if (!response) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Query vacancy separately to check workspace access
    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Проверка принадлежности вакансии к workspace
    if (vacancy.workspaceId !== workspaceId) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Отправляем событие в Inngest для асинхронной обработки
    await inngest.send({
      name: "candidate/welcome",
      data: {
        responseId,
        username,
      },
    });

    return {
      success: true,
      message: "Приветственное сообщение отправляется в фоновом режиме",
    };
  });
