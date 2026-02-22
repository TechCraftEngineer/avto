import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const rejectCandidate = protectedProcedure
  .input(
    z.object({
      candidateId: z.uuid(),
      workspaceId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { candidateId, workspaceId } = input;

    const candidate = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!candidate) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    // Query vacancy separately to check workspace access
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, candidate.entityId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancy || vacancy.workspaceId !== workspaceId) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    await ctx.db
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
