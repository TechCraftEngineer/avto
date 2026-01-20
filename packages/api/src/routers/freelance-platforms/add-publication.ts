import {
  platformSourceValues,
  vacancyPublication,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const addPublicationInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid(),
  platform: z.enum(platformSourceValues),
  externalId: z.string().max(100).optional(),
  url: z.string().url().optional(),
});

export const addPublication = protectedProcedure
  .input(addPublicationInputSchema)
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

    // Проверка существования вакансии и принадлежности к workspace
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.vacancyId),
          eq(table.workspaceId, input.workspaceId),
        ),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Создаем публикацию
    const [createdPublication] = await ctx.db
      .insert(vacancyPublication)
      .values({
        vacancyId: input.vacancyId,
        platform: input.platform,
        externalId: input.externalId,
        url: input.url,
        isActive: true,
      })
      .returning();

    return {
      publication: createdPublication,
    };
  });
