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
  .handler(async ({ context, input }) => {
    // Если оба поля null/пустые, очищаем активный workspace
    if (!input.organizationId || !input.workspaceId) {
      await context.db
        .update(user)
        .set({
          lastActiveOrganizationId: null,
          lastActiveWorkspaceId: null,
        })
        .where(eq(user.id, context.session.user.id));

      return { success: true };
    }

    // Проверка доступа к организации
    const organizationAccess = await context.organizationRepository.checkAccess(
      input.organizationId,
      context.session.user.id,
    );

    if (!organizationAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Проверка существования workspace и соответствия organizationId
    const workspaceData = await context.db.query.workspace.findFirst({
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
    const workspaceAccess = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!workspaceAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Все проверки пройдены, обновляем lastActive поля
    await context.db
      .update(user)
      .set({
        lastActiveOrganizationId: input.organizationId,
        lastActiveWorkspaceId: input.workspaceId,
      })
      .where(eq(user.id, context.session.user.id));

    return { success: true };
  });
