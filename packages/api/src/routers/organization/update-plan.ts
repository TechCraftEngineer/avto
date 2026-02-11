import { organization } from "@qbs-autonaim/db/schema";
import { organizationPlanSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
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
    const org = await ctx.db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.id, input.organizationId),
      with: {
        members: {
          where: (member, { eq }) => eq(member.userId, userId),
        },
      },
    });

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Организация не найдена",
      });
    }

    // Проверяем права доступа (только owner может менять план)
    const member = org.members[0];
    if (!member || member.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только владелец организации может изменять тарифный план",
      });
    }

    // Обновляем план организации
    const [updated] = await ctx.db
      .update(organization)
      .set({ plan: input.plan })
      .where(eq(organization.id, input.organizationId))
      .returning();

    return updated;
  });
