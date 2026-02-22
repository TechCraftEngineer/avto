import { ORPCError } from "@orpc/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const getBotSettings = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace",
      });
    }

    const botSettings = await context.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) =>
        eq(botSettings.workspaceId, input.workspaceId),
    });

    return botSettings;
  });
