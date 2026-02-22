import { ORPCError } from "@orpc/server";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const listInvites = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
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

    // Проверка прав (только owner/admin могут просматривать приглашения)
    if (access.role !== "owner" && access.role !== "admin") {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для просмотра приглашений",
      });
    }

    // Получение только активных приглашений
    const invites = await context.organizationRepository.getPendingInvites(
      input.organizationId,
    );

    return invites;
  });
