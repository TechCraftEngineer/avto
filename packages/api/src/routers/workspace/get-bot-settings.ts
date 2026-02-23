import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

export const getBotSettings = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const botSettings = await context.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) =>
        eq(botSettings.workspaceId, input.workspaceId),
    });

    return botSettings;
  });
