import { and, eq } from "@qbs-autonaim/db";
import { interviewLink, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const updateVacancyStatusInputSchema = z.object({
  id: z.uuid(),
  workspaceId: workspaceIdSchema,
  status: z.enum(["active", "paused", "closed"]),
});

export const updateVacancyStatus = protectedProcedure
  .input(updateVacancyStatusInputSchema)
  .handler(async ({ input, context }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace", });
    }

    // Проверяем существование вакансии
    const existingVacancy = await context.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.id),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!existingVacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена", });
    }

    // Преобразуем статус в isActive
    const isActive = input.status === "active";

    // Обновляем статус вакансии
    const [updatedVacancy] = await context.db
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
      await context.db
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
