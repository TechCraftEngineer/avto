import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  responseTag,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const removeTag = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      tag: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy || vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    await context.db
      .delete(responseTag)
      .where(
        and(
          eq(responseTag.responseId, input.responseId),
          eq(responseTag.tag, input.tag),
        ),
      );

    return { success: true };
  });
