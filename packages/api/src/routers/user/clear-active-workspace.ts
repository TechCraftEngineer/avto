import { eq } from "@qbs-autonaim/db";
import { user } from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../orpc";

export const clearActiveWorkspace = protectedProcedure.handler(
  async ({ context }) => {
    await context.db
      .update(user)
      .set({
        lastActiveOrganizationId: null,
        lastActiveWorkspaceId: null,
      })
      .where(eq(user.id, context.session.user.id));

    return { success: true };
  },
);
