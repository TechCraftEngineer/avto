import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import {
  phoneNullishSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
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
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "��� ������� � ����� workspace",
      });
    }

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "������ �� ������" });
    }

    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("FORBIDDEN", {
        message: "��� ������� � ����� �������",
      });
    }

    const { responseId, workspaceId, ...updateData } = input;

    // Guard against empty updates
    if (Object.keys(updateData).length === 0) {
      throw new ORPCError("BAD_REQUEST", {
        message: "�� ������� ���� ��� ����������",
      });
    }

    const [updated] = await context.db
      .update(responseTable)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, input.responseId))
      .returning();

    return updated;
  });
