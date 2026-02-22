import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const getBySlug = protectedProcedure
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input, context }) => {
    const organization = await context.organizationRepository.findBySlug(
      input.slug,
    );

    if (!organization) {
      throw new ORPCError("NOT_FOUND", {
        message: "Организация не найдена",
      });
    }

    const access = await context.organizationRepository.checkAccess(
      organization.id,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    return organization;
  });
