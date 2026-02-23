import { desc, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const list = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    return context.db.query.gig.findMany({
      where: eq(gig.workspaceId, input.workspaceId),
      orderBy: [desc(gig.createdAt)],
      columns: {
        id: true,
        workspaceId: true,
        title: true,
        description: true,
        requirements: true,
        type: true,
        budgetMin: true,
        budgetMax: true,

        deadline: true,
        estimatedDuration: true,
        source: true,
        externalId: true,
        url: true,
        views: true,
        responses: true,
        newResponses: true,
        customBotInstructions: true,
        customScreeningPrompt: true,
        customInterviewQuestions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
