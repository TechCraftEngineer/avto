import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  updateFullVacancySchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const updateFull = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string(),
      workspaceId: workspaceIdSchema,
      data: updateFullVacancySchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace",
      });
    }

    const existingVacancy = await context.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!existingVacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена",
      });
    }

    const result = await context.db
      .update(vacancy)
      .set({
        title: input.data.title,
        description: input.data.description ?? null,
        requirements: input.data.requirements ?? undefined,
        source: input.data.source ?? existingVacancy.source,
        externalId: input.data.externalId ?? null,
        url: input.data.url === "" ? null : (input.data.url ?? null),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .returning();

    if (!result[0]) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена",
      });
    }

    return result[0];
  });
