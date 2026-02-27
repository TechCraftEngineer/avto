import { ORPCError } from "@orpc/server";
import {
  eq,
  getIntegration,
  getIntegrationCredentials,
  integration,
  upsertIntegration,
} from "@qbs-autonaim/db";
import { z } from "zod";
import {
  protectedProcedure,
  requireWorkspaceRole,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../orpc";

/** Типы интеграций, у которых credentials меняются только при настройке (verify) */
const CREDENTIALS_LOCKED_TYPES = ["hh", "kwork"] as const;

const updateIntegrationInputSchema = workspaceInputSchema.merge(
  z.object({
    type: z.string(),
    name: z.string().optional(),
    credentials: z.record(z.string(), z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().optional(),
  }),
);

export const updateIntegration = protectedProcedure
  .input(updateIntegrationInputSchema)
  .use(workspaceAccessMiddleware)
  .handler(async ({ input, context }) => {
    const access = context.workspaceAccess;
    if (!access) throw new Error("Workspace access required");
    requireWorkspaceRole(access, ["owner", "admin"]);

    const existing = await getIntegration(
      context.db,
      input.type,
      input.workspaceId,
    );

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Интеграция не найдена" });
    }

    // credentials для HH и Kwork меняются только при настройке (verify)
    if (
      CREDENTIALS_LOCKED_TYPES.includes(
        input.type as (typeof CREDENTIALS_LOCKED_TYPES)[number],
      )
    ) {
      const [updated] = await context.db
        .update(integration)
        .set({
          name: input.name ?? existing.name,
          metadata: (input.metadata ?? existing.metadata) as
            | Record<string, unknown>
            | undefined,
          isActive: input.isActive ?? existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(integration.id, existing.id))
        .returning({
          id: integration.id,
          type: integration.type,
          name: integration.name,
        });

      if (!updated)
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Ошибка обновления",
        });
      return { id: updated.id, type: updated.type, name: updated.name };
    }

    const credentials =
      input.credentials ??
      (await getIntegrationCredentials(
        context.db,
        input.type,
        input.workspaceId,
      )) ??
      {};

    const updated = await upsertIntegration(context.db, {
      workspaceId: input.workspaceId,
      type: input.type,
      name: input.name ?? existing.name,
      credentials,
      metadata: input.metadata ?? existing.metadata,
      isActive: input.isActive ?? existing.isActive,
    });

    return {
      id: updated.id,
      type: updated.type,
      name: updated.name,
    };
  });
