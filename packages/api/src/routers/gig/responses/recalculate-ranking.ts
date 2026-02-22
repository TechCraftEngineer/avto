import { ORPCError } from "@orpc/server";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

/**
 * ������� ��������� �������� ����������
 *
 * ���������� ������� � Inngest ��� ������� ���������
 * Requirements: 6.3
 */
export const recalculateRanking = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    // �������� ������� � workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "��� ������� � ����� workspace",
      });
    }

    // ���������� ������� � Inngest ��� ������� ���������
    try {
      await inngest.send({
        name: "gig/ranking.recalculate",
        data: {
          gigId: input.gigId,
          workspaceId: input.workspaceId,
          triggeredBy: context.session.user.id,
        },
      });
    } catch (err) {
      // ����������������� ����������� ������
      console.log({
        msg: "�� ������� ��������� ������ �� �������� ��������",
        gigId: input.gigId,
        workspaceId: input.workspaceId,
        errorMessage: String((err as Error)?.message || err),
        errorStack: (err as Error)?.stack,
      });

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "�� ������� ��������� �������� ��������",
      });
    }

    return {
      success: true,
      message: "�������� �������� �������",
    };
  });
