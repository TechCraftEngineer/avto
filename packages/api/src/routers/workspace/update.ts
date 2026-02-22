import { ORPCError } from "@orpc/server";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import {
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const update = protectedProcedure
  .input(
    z.object({
      id: workspaceIdSchema,
      data: updateWorkspaceSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.id,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для обновления workspace",
      });
    }

    // Получаем текущий workspace для проверки organizationId
    const currentWorkspace = await context.workspaceRepository.findById(
      input.id,
    );
    if (!currentWorkspace) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    if (input.data.slug) {
      const existing = await context.workspaceRepository.findBySlug(
        input.data.slug,
        currentWorkspace.organizationId,
      );
      if (existing && existing.id !== input.id) {
        throw new ORPCError({
          code: "CONFLICT",
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
