import { and, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { ensureFound } from "../../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const get = protectedProcedure
  .input(z.object({ id: z.uuid(), workspaceId: workspaceIdSchema }))
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    return ensureFound(
      await context.db.query.gig.findFirst({
        where: and(
          eq(gig.id, input.id),
          eq(gig.workspaceId, input.workspaceId),
        ),
      }),
      "Задание не найдено",
    );
  });
