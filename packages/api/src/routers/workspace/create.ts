import { ORPCError } from "@orpc/client";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import {
  createWorkspaceSchema,
  organizationIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const create = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema.optional(),
      workspace: createWorkspaceSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const organizations =
      await context.organizationRepository.getUserOrganizations(
        context.session.user.id,
      );

    if (!organizations.length) {
      throw new ORPCError("NOT_FOUND", {
        message: "У пользователя нет организаций",
      });
    }

    let organizationId: string;

    if (input.organizationId) {
      // Validate that the provided organizationId belongs to the user
      const hasAccess = organizations.some(
        (org) => org.id === input.organizationId,
      );

      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "Нет доступа к указанной организации",
        });
      }

      organizationId = input.organizationId;
    } else {
      // Fallback to first organization if organizationId is omitted
      const firstOrg = organizations[0];
      if (!firstOrg) {
        throw new ORPCError("NOT_FOUND", {
          message: "У пользователя нет организаций",
        });
      }
      organizationId = firstOrg.id;
    }

    const existing = await context.workspaceRepository.findBySlug(
      input.workspace.slug,
      organizationId,
    );
    if (existing) {
      throw new ORPCError("CONFLICT", {
        message: "Workspace с таким slug уже существует",
      });
    }

    const dataToCreate = { ...input.workspace };
    if (dataToCreate.logo?.startsWith("data:image/")) {
      dataToCreate.logo = await optimizeLogo(dataToCreate.logo);
    }

    const workspace = await context.workspaceRepository.create({
      ...dataToCreate,
      organizationId,
    });

    if (!workspace || !workspace.id) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось создать workspace",
      });
    }

    await context.workspaceRepository.addUser(
      workspace.id,
      context.session.user.id,
      "owner",
    );

    return workspace;
  });
