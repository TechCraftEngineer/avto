import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const removeMember = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      userId: z.string().min(1, "ID пользователя обязателен"),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к организации
    const access = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    // Проверка прав (только owner/admin могут удалять участников)
    if (access.role !== "owner" && access.role !== "admin") {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для удаления участников",
      });
    }

    // Удаление участника (метод сам проверит защиту последнего owner и выполнит каскадное удаление)
    await ctx.organizationRepository.removeMember(
      input.organizationId,
      input.userId,
    );

    return { success: true };
  });
