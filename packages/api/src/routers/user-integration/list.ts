import {
  decryptCredentials,
  getUserIntegrationsByUser,
} from "@qbs-autonaim/db";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const list = protectedProcedure
  .input(z.object({}).optional())
  .handler(async ({ context }) => {
    const integrations = await getUserIntegrationsByUser(
      context.db,
      context.session.user.id,
    );

    return integrations.map((int) => {
      let email: string | null = null;

      if (int.credentials) {
        try {
          const decrypted = decryptCredentials(
            int.credentials as Record<string, string>,
          );
          email = decrypted.email ?? null;
        } catch {
          // credentials не расшифровываются — не показываем
        }
      }

      return {
        id: int.id,
        type: int.type,
        name: int.name,
        isActive: int.isActive,
        lastUsedAt: int.lastUsedAt,
        createdAt: int.createdAt,
        updatedAt: int.updatedAt,
        metadata: int.metadata,
        hasCredentials: !!int.credentials,
        email,
      };
    });
  });
