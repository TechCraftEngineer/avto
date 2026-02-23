import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  updateVacancyDetailsSchema,
  vacancyWorkspaceInputSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { ensureFound } from "../../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const updateDetails = protectedProcedure
  .input(
    vacancyWorkspaceInputSchema.merge(
      z.object({ data: updateVacancyDetailsSchema }),
    ),
  )
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const existingVacancy = ensureFound(
      await context.db.query.vacancy.findFirst({
        where: and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      }),
      "Вакансия не найдена",
    );

    const result = await context.db
      .update(vacancy)
      .set({
        title: input.data.title,
        description: input.data.description,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .returning();

    return ensureFound(result[0], "Вакансия не найдена");
  });
