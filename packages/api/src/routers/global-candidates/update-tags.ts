import { and, eq } from "@qbs-autonaim/db";
import { candidateOrganization } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const updateTags = protectedProcedure
  .input(
    z.object({
      candidateId: z.string().uuid(),
      organizationId: z.string(),
      tags: z.array(z.string()),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Проверяем доступ к организации
    const hasAccess = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Находим связь кандидата с организацией
    const existingLink = await ctx.db.query.candidateOrganization.findFirst({
      where: and(
        eq(candidateOrganization.candidateId, input.candidateId),
        eq(candidateOrganization.organizationId, input.organizationId),
      ),
    });

    if (!existingLink) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден в базе организации",
      });
    }

    // Обновляем теги
    const [updated] = await ctx.db
      .update(candidateOrganization)
      .set({ tags: input.tags })
      .where(eq(candidateOrganization.id, existingLink.id))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось обновить теги кандидата",
      });
    }

    return {
      success: true,
      tags: updated.tags || [],
      updatedAt: updated.updatedAt,
    };
  });
