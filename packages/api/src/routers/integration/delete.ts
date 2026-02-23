import { deleteIntegration } from "@qbs-autonaim/db";
import { z } from "zod";
import {
  protectedProcedure,
  requireWorkspaceRole,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../orpc";

export const deleteIntegrationProcedure = protectedProcedure
  .input(workspaceInputSchema.merge(z.object({ type: z.string() })))
  .use(workspaceAccessMiddleware)
  .handler(async ({ input, context }) => {
    requireWorkspaceRole(context.workspaceAccess!, ["owner", "admin"]);

    await deleteIntegration(context.db, input.type, input.workspaceId);
    return { success: true };
  });
