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

    // Обновляем статус
    const [updated] = await ctx.db
      .update(responseTable)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, input.responseId))
      .returning();

    // Обновляем счетчик новых откликов, если статус изменился
    if (response.status !== input.status) {
      const wasNew = response.status === "NEW";
      const isNew = input.status === "NEW";

      if (wasNew && !isNew) {
        // Отклик перестал быть новым - уменьшаем счетчик
        await ctx.db
          .update(vacancy)
          .set({
            newResponses: sql`GREATEST(COALESCE(${vacancy.newResponses}, 0) - 1, 0)`,
          })
          .where(eq(vacancy.id, response.entityId));
      } else if (!wasNew && isNew) {
        // Отклик стал новым - увеличиваем счетчик
        await ctx.db
          .update(vacancy)
          .set({
            newResponses: sql`COALESCE(${vacancy.newResponses}, 0) + 1`,
          })
          .where(eq(vacancy.id, response.entityId));
      }
    }

    return updated;
  });
