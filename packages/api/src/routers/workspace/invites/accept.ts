import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const accept = protectedProcedure
  .input(z.object({ token: z.string() }))
  .handler(async ({ input, context }) => {
    const invite = await context.workspaceRepository.getInviteByToken(
      input.token,
    );

    if (!invite) {
      throw new ORPCError("NOT_FOUND", { message: "Приглашение не найдено" });
    }

    // Проверка срока действия
    if (new Date(invite.expiresAt) < new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Срок действия приглашения истек",
      });
    }

    // Проверка: приглашение для конкретного пользователя по ID
    if (
      invite.invitedUserId &&
      invite.invitedUserId !== context.session.user.id
    ) {
      throw new ORPCError("FORBIDDEN", {
        message: "Это приглашение предназначено для другого пользователя",
      });
    }

    // Проверка: приглашение для конкретного email
    if (invite.invitedEmail) {
      const sessionEmail = context.session.user.email?.toLowerCase();
      const invitedEmail = invite.invitedEmail.toLowerCase();

      if (!sessionEmail) {
        throw new ORPCError("BAD_REQUEST", {
          message: "У вашего аккаунта не указан email",
        });
      }

      if (sessionEmail !== invitedEmail) {
        // Логируем для отладки на сервере, но не раскрываем email пользователю
        console.warn(
          `Invite email mismatch: session=${sessionEmail}, invited=${invitedEmail}`,
        );
        throw new ORPCError("FORBIDDEN", {
          message: "Это приглашение не предназначено для вашей учётной записи",
        });
      }
    }

    // Проверка: пользователь уже является участником
    const existingMember = await context.workspaceRepository.checkAccess(
      invite.workspaceId,
      context.session.user.id,
    );

    if (existingMember) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Вы уже являетесь участником этого рабочего пространства",
      });
    }

    // Проверяем доступ к организации воркспейса
    const organizationAccess = await context.organizationRepository.checkAccess(
      invite.workspace.organizationId,
      context.session.user.id,
    );

    // Если пользователь не является членом организации, добавляем его
    if (!organizationAccess) {
      await context.organizationRepository.addMember(
        invite.workspace.organizationId,
        context.session.user.id,
        "member", // Роль в организации всегда "member" при приглашении в воркспейс
      );
    }

    // Добавляем пользователя в workspace
    await context.workspaceRepository.addUser(
      invite.workspaceId,
      context.session.user.id,
      invite.role,
    );

    // Удаляем использованное приглашение
    await context.workspaceRepository.deleteInviteByToken(input.token);

    return { success: true, workspace: invite.workspace };
  });
