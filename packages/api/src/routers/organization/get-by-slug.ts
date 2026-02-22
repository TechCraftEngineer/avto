import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const getBySlug = protectedProcedure
  .input(z.object({ slug: z.string() }))
  .query(async ({ input, ctx }) => {
    const organization = await ctx.organizationRepository.findBySlug(
      input.slug,
    );

    if (!organization) {
      throw new ORPCError("NOT_FOUND", {
        message: "Организация не найдена",
      });
    }

    const access = await ctx.organizationRepository.checkAccess(
      organization.id,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    return organization;
  });
