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

    // Получение workspace по slug
    const workspace = await ctx.organizationRepository.getWorkspaceBySlug(
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
