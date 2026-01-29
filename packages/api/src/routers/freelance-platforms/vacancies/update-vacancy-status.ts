import { and, eq } from "@qbs-autonaim/db";
import { interviewLink, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const updateVacancyStatusInputSchema = z.object({
  id: z.uuid(),
  workspaceId: workspaceIdSchema,
  status: z.enum(["active", "paused", "closed"]),
});

export const updateVacancyStatus = protectedProcedure
  .input(updateVacancyStatusInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем существование вакансии
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.id),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Преобразуем статус в isActive
    const isActive = input.status === "active";

    // Обновляем статус вакансии
    const [updatedVacancy] = await ctx.db
      .update(vacancy)
      .set({ isActive })
      .where(
        and(
          eq(vacancy.id, input.id),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .returning();

    // Если вакансия закрывается, деактивируем ссылку на интервью
    if (input.status === "closed") {
      await ctx.db
        .update(interviewLink)
        .set({ isActive: false })
        .where(
          and(
            eq(interviewLink.entityId, input.id),
            eq(interviewLink.entityType, "vacancy"),
          ),
        );
    }

    return updatedVacancy;
  });