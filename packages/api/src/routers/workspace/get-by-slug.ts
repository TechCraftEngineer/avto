import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { ensureFound } from "../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

export const getBySlug = protectedProcedure
  .input(
    z.object({
      slug: z.string(),
      organizationId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const workspace = ensureFound(
      await context.workspaceRepository.findBySlug(
        input.slug,
        input.organizationId,
      ),
      "Workspace не найден",
    );

    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      workspace.id,
      context.session.user.id,
    );

    return { workspace, role: access.role };
  });
