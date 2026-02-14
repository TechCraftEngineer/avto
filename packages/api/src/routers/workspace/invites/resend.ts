import { env, paths } from "@qbs-autonaim/config";

import { WorkspaceInviteEmail } from "@qbs-autonaim/emails";
import { sendEmail } from "@qbs-autonaim/emails/send";
import { addUserToWorkspaceSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../trpc";

export const resend = protectedProcedure
  .input(addUserToWorkspaceSchema)
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для отправки приглашений",
      });
    }

    const existingInvite = await ctx.workspaceRepository.findInviteByEmail(
      input.workspaceId,
      input.email,
    );

    if (!existingInvite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    const workspace = await ctx.workspaceRepository.findById(input.workspaceId);

    if (!workspace) {
      throw new TRPCError({
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
        inviterName: ctx.session.user.name || ctx.session.user.email,
        inviteLink,
        role: input.role,
      }),
    });

    return { success: true };
  });
