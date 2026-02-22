import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const checkWorkspaceAccess = protectedProcedure
  .input(
    z.object({
      organizationId: z.string().min(1),
      workspaceId: z.string().min(1),
    }),
  )
  .query(async ({ ctx, input }) => {
    const hasOrgAccess = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!hasOrgAccess) {
      return { hasAccess: false };
    }

    const hasWorkspaceAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    return { hasAccess: hasWorkspaceAccess };
  });
