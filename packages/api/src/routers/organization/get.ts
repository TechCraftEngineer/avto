import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const get = protectedProcedure
  .input(z.object({ id: organizationIdSchema }))
  .handler(async ({ input, context }) => {
    const organization = await context.organizationRepository.findById(
      input.id,
    );

    if (!organization) {
      throw new ORPCError("NOT_FOUND", {
        message: "Организация не найдена",
      });
    }

    const access = await context.organizationRepository.checkAccess(
      input.id,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    return organization;
  });
