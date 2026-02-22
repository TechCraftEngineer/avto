import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

function generateGigInvitationText(
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

export const generateInvitation = protectedProcedure
  .input(
    z.object({
      responseId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    // Получаем отклик
    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    // Создаем индивидуальную ссылку на интервью для этого отклика
    const linkGenerator = new InterviewLinkGenerator();
    const responseInterviewLink =
      await linkGenerator.getOrCreateResponseInterviewLink(
        input.responseId,
        input.workspaceId,
      );

    const interviewUrl = responseInterviewLink.url;

    // Генерируем текст приглашения
    const invitationText = generateGigInvitationText(
      existingGig.title,
      interviewUrl,
    );

    return {
      invitationText,
      interviewUrl,
      createdAt: new Date(),
    };
  });
