import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteOrganization = protectedProcedure
  .input(z.object({ id: organizationIdSchema }))
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.organizationRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access || access.role !== "owner") {
      throw new ORPCError("FORBIDDEN", {
        message: "Только owner может удалить организацию",
      });
    }

    await ctx.organizationRepository.delete(input.id);
    return { success: true };
  });
