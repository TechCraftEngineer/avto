import { and, eq, sql } from "@qbs-autonaim/db";
import {
  responseStatusValues,
  response as responseTable,
  vacancy,
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

    // Атомарно обновляем статус и счётчик newResponses в одной транзакции
    const updated = await ctx.db.transaction(async (tx) => {
      // Блокируем строку отклика для предотвращения race conditions
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

      // Обновляем статус
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

      // Обновляем счётчик новых откликов на основе статуса внутри транзакции
      const wasNew = lockedResponse.status === "NEW";
      const isNew = input.status === "NEW";

      if (wasNew && !isNew) {
        // Отклик перестал быть новым — уменьшаем счётчик
        await tx
          .update(vacancy)
          .set({
            newResponses: sql`GREATEST(COALESCE(${vacancy.newResponses}, 0) - 1, 0)`,
          })
          .where(eq(vacancy.id, lockedResponse.entityId));
      } else if (!wasNew && isNew) {
        // Отклик стал новым — увеличиваем счётчик
        await tx
          .update(vacancy)
          .set({
            newResponses: sql`COALESCE(${vacancy.newResponses}, 0) + 1`,
          })
          .where(eq(vacancy.id, lockedResponse.entityId));
      }

      return result;
    });

    return updated;
  });
