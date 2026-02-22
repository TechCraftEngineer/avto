import { ORPCError } from "@orpc/server";
import {
  decryptCredentials,
  getIntegrationsByWorkspace,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const listIntegrations = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ input, context }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    const integrations = await getIntegrationsByWorkspace(
      context.db,
      input.workspaceId,
    );

    // Не возвращаем credentials на клиент, только email/login
    return integrations.map((int: (typeof integrations)[number]) => {
      let email: string | null = null;
      let login: string | null = null;

      if (int.credentials) {
        try {
          const decrypted = decryptCredentials(
            int.credentials as Record<string, string>,
          );
          // Kwork использует login (legacy — email), остальные — email
          if (int.type === "kwork") {
            login = decrypted.login || decrypted.email || null;
          } else {
            email = decrypted.email || null;
          }
        } catch (error) {
          console.error("Failed to decrypt credentials:", error);
        }
      }

      // Извлекаем информацию об ошибке авторизации из metadata
      const metadata = int.metadata as Record<string, unknown> | null;
      const authError = metadata?.authError ? String(metadata.authError) : null;
      const authErrorAt = metadata?.authErrorAt
        ? String(metadata.authErrorAt)
        : null;
      const setupStatus = metadata?.setupStatus
        ? String(metadata.setupStatus)
        : "completed";

      return {
        id: int.id,
        type: int.type,
        name: int.name,
        isActive: int.isActive,
        lastUsedAt: int.lastUsedAt,
        createdAt: int.createdAt,
        updatedAt: int.updatedAt,
        metadata: int.metadata,
        hasCookies: !!int.cookies,
        hasCredentials: !!int.credentials,
        email,
        login,
        authError,
        authErrorAt,
        setupStatus,
      };
    });
  });
