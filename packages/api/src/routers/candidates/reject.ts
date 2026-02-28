import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const rejectCandidate = protectedProcedure
  .input(
    z.object({
      candidateId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const { candidateId, workspaceId } = input;

    const candidate = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!candidate) {
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден" });
    }

    // Query vacancy separately to check workspace access
    const vacancy = await context.db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, candidate.entityId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancy || vacancy.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому кандидату",
      });
    }

    await context.db
      .update(responseTable)
      .set({
        hrSelectionStatus: "REJECTED",
        status: "SKIPPED",
      })
      .where(
        and(
          eq(responseTable.id, candidateId),
          eq(responseTable.entityType, "vacancy"),
        ),
      );

    return { success: true };
  });
