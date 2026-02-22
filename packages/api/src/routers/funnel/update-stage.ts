import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

const stageSchema = z.enum([
  "NEW",
  "REVIEW",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
  "OFFER",
]);

type Stage = z.infer<typeof stageSchema>;

const mapStageToResponse = (
  stage: Stage,
):
  | { status: "NEW" | "EVALUATED" | "INTERVIEW" | "COMPLETED" }
  | { hrSelectionStatus: "RECOMMENDED" | "REJECTED" | "OFFER" }
  | { status: "COMPLETED"; hrSelectionStatus: "OFFER" } => {
  switch (stage) {
    case "HIRED":
      return { hrSelectionStatus: "RECOMMENDED" };
    case "REJECTED":
      return { hrSelectionStatus: "REJECTED" };
    case "OFFER":
      return { status: "COMPLETED", hrSelectionStatus: "OFFER" };
    case "INTERVIEW":
      return { status: "INTERVIEW" };
    case "REVIEW":
      return { status: "EVALUATED" };
    case "NEW":
      return { status: "NEW" };
  }
};

export const updateStage = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
      stage: stageSchema,
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
        message: "Кандидат не принадлежит вашему рабочему пространству",
      });
    }

    const updates = mapStageToResponse(input.stage);

    await ctx.db
      .update(responseTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(responseTable.id, input.candidateId),
          eq(responseTable.entityType, "vacancy"),
        ),
      );

    return { success: true };
  });
