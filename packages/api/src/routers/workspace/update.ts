import { ORPCError } from "@orpc/server";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import {
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { ensureFound } from "../../utils/ensure-found";
import {
  requireWorkspaceRole,
  verifyWorkspaceAccess,
} from "../../utils/verify-workspace-access";

export const update = protectedProcedure
  .input(
    z.object({
      id: workspaceIdSchema,
      data: updateWorkspaceSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.id,
      context.session.user.id,
    );
    requireWorkspaceRole(access, ["owner", "admin"]);

    const currentWorkspace = ensureFound(
      await context.workspaceRepository.findById(input.id),
      "Workspace не найден",
    );

    if (input.data.slug) {
      const existing = await context.workspaceRepository.findBySlug(
        input.data.slug,
        currentWorkspace.organizationId,
      );
      if (existing && existing.id !== input.id) {
        throw new ORPCError("CONFLICT", {
          message: "Workspace с таким slug уже существует",
        });
      }
    }

    const { logo, customDomainId, ...restData } = input.data;

    const dataToUpdate: {
      name?: string;
      slug?: string;
      description?: string;
      website?: string;
      logo?: string;
      customDomainId?: string | null;
    } = { ...restData };

    if (logo?.startsWith("data:image/")) {
      dataToUpdate.logo = await optimizeLogo(logo);
    } else if (logo !== undefined) {
      dataToUpdate.logo = logo ?? undefined;
    }

    if (customDomainId !== undefined) {
      dataToUpdate.customDomainId = customDomainId || null;
    }

    const updated = await context.workspaceRepository.update(
      input.id,
      dataToUpdate,
    );
    return updated;
  });
