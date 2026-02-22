import { ORPCError } from "@orpc/server";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import {
  createWorkspaceSchema,
  organizationIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const createWorkspace = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      workspace: createWorkspaceSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    // Проверка доступа к организации
    const access = await context.organizationRepository.checkAccess(
      input.organizationId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    // Проверка уникальности slug в рамках организации
    const existing = await context.organizationRepository.getWorkspaceBySlug(
      input.organizationId,
      input.workspace.slug,
    );

    if (existing) {
      throw new ORPCError("CONFLICT", {
        message: "Workspace с таким slug уже существует в этой организации",
      });
    }

    // Оптимизация логотипа если нужно
    const dataToCreate = { ...input.workspace };
    if (dataToCreate.logo?.startsWith("data:image/")) {
      dataToCreate.logo = await optimizeLogo(dataToCreate.logo);
    }

    // Создание workspace с organizationId
    const workspace = await context.workspaceRepository.create({
      ...dataToCreate,
      organizationId: input.organizationId,
    });

    if (!workspace) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось создать workspace",
      });
    }

    // Проверка что id был сгенерирован
    if (!workspace.id) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось сгенерировать ID workspace",
      });
    }

    // Добавление создателя как owner с защитой от ошибок
    try {
      await context.workspaceRepository.addUser(
        workspace.id,
        context.session.user.id,
        "owner",
      );
    } catch (error) {
      // Очистка: удаляем созданный workspace если не удалось добавить владельца
      try {
        await context.workspaceRepository.delete(workspace.id);
      } catch (cleanupError) {
        console.error("Failed to cleanup workspace after addUser failure:", {
          workspaceId: workspace.id,
          cleanupError,
        });
      }

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось назначить владельца workspace",
        cause: error,
      });
    }

    return workspace;
  });
