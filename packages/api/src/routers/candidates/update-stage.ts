import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

const stageToStatusMap = {
  SCREENING_DONE: { status: "NEW" as const, hrSelectionStatus: null },
  INTERVIEW: { status: "INTERVIEW" as const, hrSelectionStatus: null },
  OFFER_SENT: {
    status: "COMPLETED" as const,
    hrSelectionStatus: "OFFER" as const,
  },
  SECURITY_PASSED: {
    status: "COMPLETED" as const,
    hrSelectionStatus: "SECURITY_PASSED" as const,
  },
  CONTRACT_SENT: {
    status: "COMPLETED" as const,
    hrSelectionStatus: "CONTRACT_SENT" as const,
  },
  ONBOARDING: {
    status: "COMPLETED" as const,
    hrSelectionStatus: "ONBOARDING" as const,
  },
  REJECTED: {
    status: "SKIPPED" as const,
    hrSelectionStatus: "REJECTED" as const,
  },
} as const;

export const updateStage = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
      stage: z.enum([
        "SCREENING_DONE",
        "INTERVIEW",
        "OFFER_SENT",
        "SECURITY_PASSED",
        "CONTRACT_SENT",
        "ONBOARDING",
        "REJECTED",
      ]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    // Query vacancy separately to check workspace access
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    if (vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    const updateData = stageToStatusMap[input.stage];

    if (!updateData) {
      throw new ORPCError({
        code: "BAD_REQUEST",
        message: "Неверный статус",
      });
    }

    await ctx.db
      .update(responseTable)
      .set(updateData)
      .where(
        and(
          eq(responseTable.id, input.candidateId),
          eq(responseTable.entityType, "vacancy"),
        ),
      );

    return { success: true };
  });
