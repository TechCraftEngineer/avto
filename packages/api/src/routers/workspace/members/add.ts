import { ORPCError } from "@orpc/server";
import { env, paths } from "@qbs-autonaim/config";
import { WorkspaceInviteEmail } from "@qbs-autonaim/emails";
import { sendEmail } from "@qbs-autonaim/emails/send";
import { addUserToWorkspaceSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../../orpc";

export const add = protectedProcedure
  .input(addUserToWorkspaceSchema)
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для приглашения пользователей",
      });
    }

    const user = await context.workspaceRepository.findUserByEmail(input.email);
    const userId = user?.id || null;

    if (userId) {
      const existingMember = await context.workspaceRepository.checkAccess(
        input.workspaceId,
        userId,
      );

      if (existingMember) {
        throw new ORPCError({
          code: "BAD_REQUEST",
          message: "Пользователь уже является участником workspace",
        });
      }
    }

    const existingInvite = await context.workspaceRepository.findInviteByEmail(
      input.workspaceId,
      input.email,
    );

    if (existingInvite) {
      throw new ORPCError({
        code: "BAD_REQUEST",
        message: "Приглашение для этого email уже существует",
      });
    }

    const invite = await context.workspaceRepository.createPersonalInvite(
      input.workspaceId,
      context.session.user.id,
      input.email,
      userId,
      input.role,
    );

    const workspace = await context.workspaceRepository.findById(
      input.workspaceId,
    );

    if (workspace) {
      const inviteLink = `${env.APP_URL}${paths.invitations.accept(invite.token)}`;

      await sendEmail({
        to: [input.email],
        subject: `Приглашение в ${workspace.name}`,
        react: WorkspaceInviteEmail({
          workspaceName: workspace.name,
          workspaceLogo: workspace.logo || undefined,
          inviterName: context.session.user.name || context.session.user.email,
          inviteLink,
          role: input.role,
        }),
      });
    }

    return invite;
  });
