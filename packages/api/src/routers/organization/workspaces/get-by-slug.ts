import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const getWorkspaceBySlug = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      slug: z.string().min(1),
    }),
  )
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

    // Получение workspace по slug
    const workspace = await context.organizationRepository.getWorkspaceBySlug(
      input.organizationId,
      input.slug,
    );

    if (!workspace) {
      throw new ORPCError("NOT_FOUND", {
        message: "Workspace не найден",
      });
    }

    return workspace;
  });
