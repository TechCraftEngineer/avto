import { and, eq } from "@qbs-autonaim/db";
import {
  responseStatusValues,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const updateStatus = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      status: z.enum(responseStatusValues),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // Получаем отклик
    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Получаем вакансию для проверки доступа
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.entityId),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      existingVacancy.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const updated = await ctx.db.transaction(async (tx) => {
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Отклик не найден",
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось обновить статус отклика",
        });
      }

      return result;
    });

    return updated;
  });
