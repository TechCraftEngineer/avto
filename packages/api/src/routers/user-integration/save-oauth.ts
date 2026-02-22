import { ORPCError } from "@orpc/server";
import { upsertUserIntegration } from "@qbs-autonaim/db";
import { userIntegrationTypeSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

/**
 * Сохранить user-интеграцию после OAuth callback.
 * Вызывается из Route Handler после обмена code на tokens.
 * Также может вызываться напрямую если токены получены иным способом.
 */
export const saveOAuth = protectedProcedure
  .input(
    z.object({
      type: userIntegrationTypeSchema,
      name: z.string().min(1).max(200),
      credentials: z.object({
        access_token: z.string().min(1),
        refresh_token: z.string().optional(),
        expiry_date: z.number().optional(),
      }),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    if (input.type !== "google_calendar") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Неподдерживаемый тип интеграции",
      });
    }

    const credentials: Record<string, string> = {
      access_token: input.credentials.access_token,
      ...(input.credentials.refresh_token && {
        refresh_token: input.credentials.refresh_token,
      }),
      ...(input.credentials.expiry_date !== undefined && {
        expiry_date: String(input.credentials.expiry_date),
      }),
    };

    const integration = await upsertUserIntegration(context.db, {
      userId: context.session.user.id,
      type: input.type,
      name: input.name,
      credentials,
      metadata: input.metadata,
      isActive: true,
    });

    return {
      id: integration.id,
      type: integration.type,
      name: integration.name,
    };
  });
