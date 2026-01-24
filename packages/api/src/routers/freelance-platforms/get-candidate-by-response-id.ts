import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable, vacancy as vacancyTable } from "@qbs-autonaim/db/schema";
import { organizationMember } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const getCandidateByResponseIdInputSchema = z.object({
  responseId: z.string().uuid(),
  vacancyId: z.string().uuid(),
});

export const getCandidateByResponseId = protectedProcedure
  .input(getCandidateByResponseIdInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем, что response принадлежит указанной vacancy
    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "vacancy"),
        eq(responseTable.entityId, input.vacancyId),
      ),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден или не принадлежит этой вакансии",
      });
    }

    // Проверяем, что vacancy существует и активна
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, input.vacancyId),
      with: {
        workspace: {
          with: {
            organization: true,
          },
        },
      },
    });

    if (!vacancy || !vacancy.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена или закрыта",
      });
    }

    // Проверяем доступ: пользователь должен быть владельцем организации
    const userId = ctx.session.user.id;
    const isOwner = await ctx.db.query.organizationMember.findFirst({
      where: and(
        eq(organizationMember.organizationId, vacancy.workspace.organization.id),
        eq(organizationMember.userId, userId),
        eq(organizationMember.role, "owner"),
      ),
    });

    if (!isOwner) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к данным кандидата",
      });
    }

    return {
      candidateName: response.candidateName,
      email: response.email,
      phone: response.phone,
      telegramUsername: response.telegramUsername,
      platformProfileUrl: response.platformProfileUrl,
    };
  });