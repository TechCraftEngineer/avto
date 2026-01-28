import { and, eq } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { getInterviewUrlFromEntity } from "@qbs-autonaim/server-utils";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

function generateGigInvitationText(
  candidateName: string | null,
  gigTitle: string,
  interviewUrl: string,
): string {
  // Простой краткий шаблон для gig
  const lines = [
    "Здравствуйте!",
    "",
    `Спасибо за отклик на задание "${gigTitle}".`,
    "",
    "Для продолжения пройдите короткое интервью с AI-ассистентом (5-10 минут):",
    interviewUrl,
    "",
    "После интервью мы свяжемся с вами.",
  ];

  return lines.join("\n");
}

export const getInvitation = protectedProcedure
  .input(
    z.object({
      responseId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Получаем отклик
    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new TRPCError({
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
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Генерируем URL интервью на лету
    const interviewUrl = await getInterviewUrlFromEntity(
      response.id, // Используем responseId как токен для индивидуальной ссылки
      "gig",
      existingGig.id,
    );

    // Генерируем текст приглашения на лету
    const invitationText = generateGigInvitationText(
      response.candidateName,
      existingGig.title,
      interviewUrl,
    );

    return {
      invitationText,
      interviewUrl,
      createdAt: new Date(), // Фиктивное время создания
    };
  });
