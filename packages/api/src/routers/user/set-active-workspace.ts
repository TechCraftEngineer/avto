import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { user, workspace } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const setActiveWorkspace = protectedProcedure
  .input(
    z.object({
      organizationId: z
        .string()
        .transform((val) => (val === "" ? null : val))
        .nullable(),
      workspaceId: z
        .string()
        .transform((val) => (val === "" ? null : val))
        .nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // Если оба поля null/пустые, очищаем активный workspace
    if (!input.organizationId || !input.workspaceId) {
      await ctx.db
        .update(user)
        .set({
          lastActiveOrganizationId: null,
          lastActiveWorkspaceId: null,
        })
        .where(eq(user.id, ctx.session.user.id));

      return { success: true };
    }

    // Проверка доступа к организации
    const organizationAccess = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!organizationAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Проверка существования workspace и соответствия organizationId
    const workspaceData = await ctx.db.query.workspace.findFirst({
      where: and(
        eq(workspace.id, input.workspaceId),
        eq(workspace.organizationId, input.organizationId),
      ),
    });

    if (!workspaceData) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден или не принадлежит указанной организации",
      });
    }

    // Проверка доступа к workspace
    const workspaceAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!workspaceAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Все проверки пройдены, обновляем lastActive поля
    await ctx.db
      .update(user)
      .set({
        lastActiveOrganizationId: input.organizationId,
        lastActiveWorkspaceId: input.workspaceId,
      })
      .where(eq(user.id, ctx.session.user.id));

    return { success: true };
  });
