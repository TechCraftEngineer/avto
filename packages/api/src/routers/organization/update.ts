import { ORPCError } from "@orpc/server";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import {
  organizationIdSchema,
  updateOrganizationSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const update = protectedProcedure
  .input(
    z.object({
      id: organizationIdSchema,
      data: updateOrganizationSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.organizationRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для обновления организации",
      });
    }

    if (input.data.slug) {
      const existing = await ctx.organizationRepository.findBySlug(
        input.data.slug,
      );
      if (existing && existing.id !== input.id) {
        throw new ORPCError("CONFLICT", {
          message: "Организация с таким slug уже существует",
        });
      }
    }

    const dataToUpdate = { ...input.data };
    if (dataToUpdate.logo?.startsWith("data:image/")) {
      dataToUpdate.logo = await optimizeLogo(dataToUpdate.logo);
    } else if (dataToUpdate.logo === null) {
      dataToUpdate.logo = undefined;
    }

    const updated = await ctx.organizationRepository.update(
      input.id,
      dataToUpdate,
    );
    return updated;
  });
