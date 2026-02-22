import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const deleteInvite = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      inviteId: z.string().min(1, "ID приглашения обязателен"),
    }),
  )
  .handler(async ({ input, context }) => {
    // Проверка доступа к организации
    const access = await context.organizationRepository.checkAccess(
      input.organizationId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    // Проверка прав (только owner/admin могут отменять приглашения)
    if (access.role !== "owner" && access.role !== "admin") {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для отмены приглашений",
      });
    }

    // Загрузка приглашения
    const invite = await context.organizationRepository.getInviteById(
      input.inviteId,
    );

    if (!invite) {
      throw new ORPCError("NOT_FOUND", {
        message: "Приглашение не найдено",
      });
    }

    // Проверка принадлежности приглашения к организации
    if (invite.organizationId !== input.organizationId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    // Отмена приглашения
    await context.organizationRepository.deleteInvite(input.inviteId);

    return { success: true };
  });
