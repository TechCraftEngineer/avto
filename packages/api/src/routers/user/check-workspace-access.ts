import {
  organizationIdSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const checkWorkspaceAccess = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const hasOrgAccess = await context.organizationRepository.checkAccess(
      input.organizationId,
      context.session.user.id,
    );

    if (!hasOrgAccess) {
      return { hasAccess: false };
    }

    const hasWorkspaceAccess = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    return { hasAccess: hasWorkspaceAccess };
  });
