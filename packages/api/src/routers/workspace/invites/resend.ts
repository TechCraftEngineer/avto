import { ORPCError } from "@orpc/server";
import { env, paths } from "@qbs-autonaim/config";
import { WorkspaceInviteEmail } from "@qbs-autonaim/emails";
import { sendEmail } from "@qbs-autonaim/emails/send";
import { addUserToWorkspaceSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../../orpc";

export const resend = protectedProcedure
  .input(addUserToWorkspaceSchema)
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для отправки приглашений",
      });
    }

    const existingInvite = await context.workspaceRepository.findInviteByEmail(
      input.workspaceId,
      input.email,
    );

    if (!existingInvite) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    const workspace = await context.workspaceRepository.findById(
      input.workspaceId,
    );

    if (!workspace) {
      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Workspace не найден",
      });
    }

    const inviteLink = `${env.APP_URL}${paths.invitations.accept(existingInvite.token)}`;

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

    return { success: true };
  });
