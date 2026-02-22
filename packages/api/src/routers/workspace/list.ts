import { protectedProcedure } from "../../orpc";

export const list = protectedProcedure.handler(async ({ context }) => {
  const workspaces = await context.workspaceRepository.findByUserId(
    context.session.user.id,
  );
  return workspaces;
});
