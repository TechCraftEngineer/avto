import { botSettings, eq } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const updateOnboarding = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      onboardingCompleted: z.boolean().optional(),
      dismissedGettingStarted: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    // �������� ������� � workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", { message: "������������ ���� ��� ��������� �������� ����������", });
    }

    // ��������� ������������ ���������
    const existing = await context.db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, input.workspaceId),
    });

    const updateData: Record<string, Date | boolean> = {
      updatedAt: new Date(),
    };

    if (input.onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = input.onboardingCompleted;
      if (input.onboardingCompleted) {
        updateData.onboardingCompletedAt = new Date();
      }
    }

    if (input.dismissedGettingStarted !== undefined) {
      updateData.dismissedGettingStarted = input.dismissedGettingStarted;
      if (input.dismissedGettingStarted) {
        updateData.dismissedGettingStartedAt = new Date();
      }
    }

    if (existing) {
      // ��������� ������������
      const [updated] = await context.db
        .update(botSettings)
        .set(updateData)
        .where(eq(botSettings.id, existing.id))
        .returning();

      return updated;
    }

    // ������� ����� � �������� ����������
    const [created] = await context.db
      .insert(botSettings)
      .values({
        workspaceId: input.workspaceId,
        companyName: "��� ��������", // �������� �� ���������
        ...updateData,
      })
      .returning();

    return created;
  });
