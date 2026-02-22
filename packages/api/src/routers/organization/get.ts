import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const get = protectedProcedure
  .input(z.object({ id: organizationIdSchema }))
  .query(async ({ input, ctx }) => {
    const organization = await ctx.organizationRepository.findById(input.id);

    if (!organization) {
      throw new ORPCError("NOT_FOUND", {
        message: "Организация не найдена",
      });
    }

    const access = await ctx.organizationRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    return organization;
  });
