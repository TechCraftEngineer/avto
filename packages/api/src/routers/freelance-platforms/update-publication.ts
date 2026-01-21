import { eq } from "drizzle-orm";
import { z } from "zod";
import { vacancyPublication } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

const updatePublicationInputSchema = z.object({
  workspaceId: z.string().uuid(),
  publicationId: z.string().uuid(),
  externalId: z.string().max(100).optional(),
  url: z.string().url("Введите корректный URL").optional().or(z.literal("")),
});

export const updatePublication = protectedProcedure
  .input(updatePublicationInputSchema)
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

    // Проверяем существование публикации и получаем связанную вакансию
    const publication = await ctx.db.query.vacancyPublication.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.id, input.publicationId),
      with: {
        vacancy: {
          columns: {
            workspaceId: true,
          },
        },
      },
    });

    if (!publication) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Публикация не найдена",
      });
    }

    // Проверяем, что публикация принадлежит к workspace
    if (publication.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этой публикации",
      });
    }

    // Обновляем публикацию
    const [updatedPublication] = await ctx.db
      .update(vacancyPublication)
      .set({
        externalId: input.externalId || null,
        url: input.url || null,
        updatedAt: new Date(),
      })
      .where(eq(vacancyPublication.id, input.publicationId))
      .returning();

    if (!updatedPublication) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось обновить публикацию",
      });
    }

    return {
      publication: updatedPublication,
    };
  });