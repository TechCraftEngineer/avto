import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const listWorkspaces = protectedProcedure
  .input(z.object({ organizationId: organizationIdSchema }))
  .handler(async ({ input, context }) => {
    // Проверка доступа к организации
    const access = await context.organizationRepository.checkAccess(
      input.organizationId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    // Получение всех workspaces организации
    const workspaces = await context.organizationRepository.getWorkspaces(
      input.organizationId,
    );

    return workspaces;
  });
