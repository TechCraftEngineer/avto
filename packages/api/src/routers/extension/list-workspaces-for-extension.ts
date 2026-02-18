import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

/**
 * Возвращает список workspace пользователя для выбора в расширении.
 * Использует organizationId из userData расширения.
 */
export const listWorkspacesForExtension = protectedProcedure
  .input(
    z.object({
      organizationId: z.string().min(1),
    }),
  )
  .query(async ({ input, ctx }) => {
    const access = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    const workspaces = await ctx.organizationRepository.getWorkspaces(
      input.organizationId,
    );

    return workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
    }));
  });
