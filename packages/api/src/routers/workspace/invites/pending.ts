import { protectedProcedure } from "../../../orpc";

export const pending = protectedProcedure.handler(async ({ context }) => {
  const invites = await context.workspaceRepository.getPendingInvitesByUser(
    context.session.user.id,
    context.session.user.email,
  );
  return invites;
});
