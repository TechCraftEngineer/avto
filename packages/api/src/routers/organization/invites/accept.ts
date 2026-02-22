import { ORPCError } from "@orpc/server";
import type { OrganizationMember } from "@qbs-autonaim/db";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const acceptInvite = protectedProcedure
  .input(
    z.object({
      token: z.string().min(1, "Токен обязателен"),
    }),
  )
  .handler(async ({ input, context }) => {
    // Получение приглашения по токену
    const invite = await context.organizationRepository.getInviteByToken(
      input.token,
    );

    if (!invite) {
      throw new ORPCError("NOT_FOUND", {
        message: "Приглашение не найдено",
      });
    }

    // Проверка срока действия
    if (invite.expiresAt < new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Срок действия приглашения истек",
      });
    }

    // Получение организации
    const organization = await context.organizationRepository.findById(
      invite.organizationId,
    );

    if (!organization) {
      throw new ORPCError("NOT_FOUND", {
        message: "Организация не найдена",
      });
    }

    // Проверка, не является ли пользователь уже участником
    const existingMember = await context.organizationRepository.checkAccess(
      invite.organizationId,
      context.session.user.id,
    );

    if (existingMember) {
      throw new ORPCError("CONFLICT", {
        message: "Вы уже являетесь участником этой организации",
      });
    }

    // Добавление пользователя в организацию с указанной ролью
    let member: OrganizationMember;
    try {
      member = await context.organizationRepository.addMember(
        invite.organizationId,
        context.session.user.id,
        invite.role,
      );

      // Удаление приглашения только после успешного добавления
      await context.organizationRepository.deleteInvite(invite.id);
    } catch (error) {
      // Если добавление не удалось, не удаляем приглашение
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось добавить пользователя в организацию",
        cause: error,
      });
    }

    return {
      member,
      organization,
    };
  });
