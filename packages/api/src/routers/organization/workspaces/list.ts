import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const listWorkspaces = protectedProcedure
  .input(z.object({ organizationId: organizationIdSchema }))
  .query(async ({ input, ctx }) => {
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

    // Получение всех workspaces организации
    const workspaces = await ctx.organizationRepository.getWorkspaces(
      input.organizationId,
    );

    return workspaces;
  });
