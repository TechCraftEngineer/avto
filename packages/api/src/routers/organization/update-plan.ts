import { organizationPlanSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

/**
 * Обновление тарифного плана организации
 * Требует роль owner
 */
export const updatePlan = protectedProcedure
  .input(
    z.object({
      organizationId: z.string().min(1, "ID организации обязателен"),
      plan: organizationPlanSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    // Проверяем существование организации
    const organization = await ctx.db.organization.findUnique({
      where: { id: input.organizationId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Организация не найдена",
      });
    }

    // Проверяем права доступа (только owner может менять план)
    const member = organization.members[0];
    if (!member || member.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только владелец организации может изменять тарифный план",
      });
    }

    // Обновляем план организации
    const updated = await ctx.db.organization.update({
      where: { id: input.organizationId },
      data: { plan: input.plan },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        updatedAt: true,
      },
    });

    return updated;
  });
