import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteOrganization = protectedProcedure
  .input(z.object({ id: organizationIdSchema }))
  .handler(async ({ input, context }) => {
    const access = await context.organizationRepository.checkAccess(
      input.id,
      context.session.user.id,
    );

    if (!access || access.role !== "owner") {
      throw new ORPCError("FORBIDDEN", {
        message: "Только owner может удалить организацию",
      });
    }

    await context.organizationRepository.delete(input.id);
    return { success: true };
  });
