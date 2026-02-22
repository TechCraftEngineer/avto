import { protectedProcedure } from "../../orpc";

export const list = protectedProcedure.handler(async ({ context }) => {
  const organizations =
    await context.organizationRepository.getUserOrganizations(
      context.session.user.id,
    );
  return organizations;
});
