import { user } from "@qbs-autonaim/db/schema";
import { eq } from "@qbs-autonaim/db";
import { protectedProcedure } from "../../trpc";

export const clearActiveWorkspace = protectedProcedure.mutation(
  async ({ ctx }) => {
    await ctx.db
      .update(user)
      .set({
        lastActiveOrganizationId: null,
        lastActiveWorkspaceId: null,
      })
      .where(eq(user.id, ctx.session.user.id));

    return { success: true };
  },
);
