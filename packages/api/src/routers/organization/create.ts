import { ORPCError } from "@orpc/client";
import { organization, organizationMember } from "@qbs-autonaim/db";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import { createOrganizationSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../orpc";

export const create = protectedProcedure
  .input(createOrganizationSchema)
  .handler(async ({ input, context: ctx }) => {
    const existing = await context.organizationRepository.findBySlug(input.slug);
    if (existing) {
      throw new ORPCError("CONFLICT", {
        message: "Организация с таким slug уже существует",
      });
    }

    const dataToCreate = { ...input };
    if (dataToCreate.logo?.startsWith("data:image/")) {
      dataToCreate.logo = await optimizeLogo(dataToCreate.logo);
    }

    try {
      const result = await context.db.transaction(async (tx) => {
        const [newOrg] = await tx
          .insert(organization)
          .values(dataToCreate)
          .returning();

        if (!newOrg) {
          throw new Error("Не удалось создать организацию");
        }

        const [member] = await tx
          .insert(organizationMember)
          .values({
            organizationId: newOrg.id,
            userId: context.session.user.id,
            role: "owner",
          })
          .returning();

        if (!member) {
          throw new Error("Не удалось добавить владельца организации");
        }

        return newOrg;
      });

      return result;
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          error instanceof Error
            ? error.message
            : "Не удалось создать организацию",
      });
    }
  });
