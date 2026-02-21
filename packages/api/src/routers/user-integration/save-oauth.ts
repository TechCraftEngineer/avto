import { upsertUserIntegration } from "@qbs-autonaim/db";
import { userIntegrationTypeSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

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
  .mutation(async ({ input, ctx }) => {
    if (input.type !== "google_calendar") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Неподдерживаемый тип интеграции",
      });
    }

    const integration = await upsertUserIntegration(ctx.db, {
      userId: ctx.session.user.id,
      type: input.type,
      name: input.name,
      credentials: input.credentials as Record<string, string>,
      metadata: input.metadata,
      isActive: true,
    });

    return {
      id: integration.id,
      type: integration.type,
      name: integration.name,
    };
  });
