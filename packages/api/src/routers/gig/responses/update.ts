import { and, eq } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import {
  phoneNullishSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const update = protectedProcedure
  .input(
    z.object({
      responseId: z.uuid(),
      workspaceId: workspaceIdSchema,
      candidateName: z.string().max(500).nullish(),
      telegramUsername: z.string().max(100).nullish(),
      phone: phoneNullishSchema,
      email: z.email().max(255).nullish(),
      proposedPrice: z.number().int().positive().nullish(),

      proposedDeliveryDays: z.number().int().positive().nullish(),
      coverLetter: z.string().nullish(),
      resumeLanguage: z.string().max(10).nullish(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const { responseId, workspaceId, ...updateData } = input;

    // Guard against empty updates
    if (Object.keys(updateData).length === 0) {
      throw new ORPCError({
        code: "BAD_REQUEST",
        message: "Не указаны поля для обновления",
      });
    }

    const [updated] = await ctx.db
      .update(responseTable)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, input.responseId))
      .returning();

    return updated;
  });
