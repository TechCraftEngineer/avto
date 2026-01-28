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

export const generateInvitation = protectedProcedure
  .input(
    z.object({
      responseId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
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

    // Получаем или создаём ссылку на интервью для гига
    let link = await ctx.db.query.interviewLink.findFirst({
      where: and(
        eq(interviewLink.entityType, "gig"),
        eq(interviewLink.entityId, response.entityId),
        eq(interviewLink.isActive, true),
      ),
    });

    if (!link) {
      // Создаём новую ссылку с retry механизмом для обработки race condition
      const MAX_ATTEMPTS = 5;
      let lastError: unknown;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const token = generateSlug();

          const [created] = await ctx.db
            .insert(interviewLink)
            .values({
              entityType: "gig",
              entityId: response.entityId,
              token,
              isActive: true,
            })
            .returning();

          if (created) {
            link = created;
            break;
          }
        } catch (error) {
          lastError = error;

          // Проверяем, является ли ошибка нарушением уникального ограничения
          const isUniqueViolation =
            error &&
            typeof error === "object" &&
            "code" in error &&
            (error.code === "23505" || error.code === "SQLITE_CONSTRAINT");

          if (!isUniqueViolation) {
            // Если это не ошибка уникальности, пробрасываем её сразу
            throw error;
          }

          // Если это последняя попытка, выбрасываем ошибку
          if (attempt === MAX_ATTEMPTS - 1) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Не удалось создать уникальную ссылку на интервью после нескольких попыток",
              cause: lastError,
            });
          }

          // Иначе повторяем попытку с новым token
        }
      }

      if (!link) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать ссылку на интервью",
          cause: lastError,
        });
      }
    }

    // Создаем индивидуальную ссылку на интервью для этого отклика
    const { InterviewLinkGenerator } = await import(
      "@qbs-autonaim/interview-link-generator"
    );
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.getOrCreateResponseInterviewLink(
      input.responseId,
      input.workspaceId,
    );

    const interviewUrl = interviewLink.url;

    // Генерируем текст приглашения
    const invitationText = generateGigInvitationText(
      response.candidateName,
      existingGig.title,
      interviewUrl,
    );

    return {
      invitationText,
      interviewUrl,
      createdAt: new Date(),
    };
  });
