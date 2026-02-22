import { deleteUserIntegration } from "@qbs-autonaim/db";
import { userIntegrationTypeSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteItem = protectedProcedure
  .input(z.object({ type: userIntegrationTypeSchema }))
  .handler(async ({ input, context }) => {
    await deleteUserIntegration(
      context.db,
      context.session.user.id,
      input.type,
    );
  });
