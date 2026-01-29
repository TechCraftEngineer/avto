import { and, eq, isNull } from "@qbs-autonaim/db";
import {
  interviewLink,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const mergeVacanciesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  sourceVacancyId: z.uuid(),
  targetVacancyId: z.uuid(),
});

export const mergeVacancies = protectedProcedure
  .input(mergeVacanciesInputSchema)
  .mutation(async ({ input, ctx }) => {
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

    if (input.sourceVacancyId === input.targetVacancyId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Нельзя сдружить вакансию саму с собой",
      });
    }

    return await ctx.db.transaction(async (tx) => {
      const source = await tx.query.vacancy.findFirst({
        where: and(
          eq(vacancy.id, input.sourceVacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      });

      const target = await tx.query.vacancy.findFirst({
        where: and(
          eq(vacancy.id, input.targetVacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      });

      if (!source || !target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Одна из вакансий не найдена",
        });
      }

      if (source.mergedIntoVacancyId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Эта вакансия уже сдружена с другой",
        });
      }

      if (target.mergedIntoVacancyId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Нельзя выбрать в качестве основной уже сдруженную вакансию",
        });
      }

      await tx
        .update(responseTable)
        .set({ entityId: input.targetVacancyId })
        .where(
          and(
            eq(responseTable.entityType, "vacancy"),
            eq(responseTable.entityId, input.sourceVacancyId),
          ),
        );

      // Проверяем, есть ли уже interviewLink у целевой вакансии
      const existingTargetLink = await tx.query.interviewLink.findFirst({
        where: and(
          eq(interviewLink.entityType, "vacancy"),
          eq(interviewLink.entityId, input.targetVacancyId),
        ),
      });

      if (existingTargetLink) {
        // Если у целевой вакансии уже есть ссылка, удаляем ссылку исходной вакансии
        await tx
          .delete(interviewLink)
          .where(
            and(
              eq(interviewLink.entityType, "vacancy"),
              eq(interviewLink.entityId, input.sourceVacancyId),
            ),
          );
      } else {
        // Если у целевой вакансии нет ссылки, переносим ссылку исходной вакансии
        await tx
          .update(interviewLink)
          .set({ entityId: input.targetVacancyId })
          .where(
            and(
              eq(interviewLink.entityType, "vacancy"),
              eq(interviewLink.entityId, input.sourceVacancyId),
            ),
          );
      }

      const [updated] = await tx
        .update(vacancy)
        .set({ mergedIntoVacancyId: input.targetVacancyId })
        .where(
          and(
            eq(vacancy.id, input.sourceVacancyId),
            eq(vacancy.workspaceId, input.workspaceId),
            isNull(vacancy.mergedIntoVacancyId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Не удалось сдружить вакансию. Возможно, она уже была изменена.",
        });
      }

      return { success: true as const };
    });
  });