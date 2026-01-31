import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  updateFullVacancySchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const updateFull = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string(),
      workspaceId: workspaceIdSchema,
      data: updateFullVacancySchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
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

    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    const result = await ctx.db
      .update(vacancy)
      .set({
        title: input.data.title,
        description: input.data.description ?? null,
        requirements: input.data.requirements ?? undefined,
        customBotInstructions: input.data.customBotInstructions ?? null,
        customScreeningPrompt: input.data.customScreeningPrompt ?? null,
        customInterviewQuestions: input.data.customInterviewQuestions ?? null,
        customOrganizationalQuestions:
          input.data.customOrganizationalQuestions ?? null,
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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    return result[0];
  });
