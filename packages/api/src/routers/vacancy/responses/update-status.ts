import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  responseStatusValues,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const updateStatus = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      status: z.enum(responseStatusValues),
    }),
  )
  .handler(async ({ context, input }) => {
    // Получаем отклик
    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден",
      });
    }

    // Получаем вакансию для проверки доступа
    const existingVacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.entityId),
    });

    if (!existingVacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена",
      });
    }

    // Проверяем доступ к workspace
    const hasAccess = await context.workspaceRepository.checkAccess(
      existingVacancy.workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому отклику",
      });
    }

    const updated = await context.db.transaction(async (tx) => {
      const [lockedResponse] = await tx
        .select()
        .from(responseTable)
        .where(
          and(
            eq(responseTable.id, input.responseId),
            eq(responseTable.entityType, "vacancy"),
          ),
        )
        .for("update");

      if (!lockedResponse) {
        throw new ORPCError("NOT_FOUND", { message: "Отклик не найден",
        });
      }

      const [result] = await tx
        .update(responseTable)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(responseTable.id, input.responseId))
        .returning();

      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось обновить статус отклика",
        });
      }

      return result;
    });

    return updated;
  });
