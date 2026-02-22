import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const getBySlug = protectedProcedure
  .input(
    z.object({
      slug: z.string(),
      organizationId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const workspace = await context.workspaceRepository.findBySlug(
      input.slug,
      input.organizationId,
    );

    if (!workspace) {
      throw new ORPCError("NOT_FOUND", { message: "Workspace не найден",
      });
    }

    const access = await context.workspaceRepository.checkAccess(
      workspace.id,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace",
      });
    }

    return { workspace, role: access.role };
  });
