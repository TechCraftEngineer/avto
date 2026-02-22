import { eq } from "@qbs-autonaim/db";
import {
  account,
  organization,
  user,
  workspace,
} from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../orpc";

export const me = protectedProcedure.query(async ({ ctx }) => {
  const userData = await ctx.db.query.user.findFirst({
    where: eq(user.id, ctx.session.user.id),
  });

  if (!userData) return null;

  const accounts = await ctx.db.query.account.findMany({
    where: eq(account.userId, ctx.session.user.id),
    columns: {
      id: true,
      providerId: true,
    },
  });

  // Получаем последнюю активную организацию и воркспейс с проверкой доступа
  let lastActiveOrganization = null;
  let lastActiveWorkspace = null;

  if (userData.lastActiveOrganizationId) {
    // Проверяем доступ к организации
    const hasOrgAccess = await ctx.organizationRepository.checkAccess(
      userData.lastActiveOrganizationId,
      ctx.session.user.id,
    );

    if (hasOrgAccess) {
      lastActiveOrganization = await ctx.db.query.organization.findFirst({
        where: eq(organization.id, userData.lastActiveOrganizationId),
      });
    }
  }

  if (userData.lastActiveWorkspaceId) {
    // Проверяем доступ к workspace
    const hasWorkspaceAccess = await ctx.workspaceRepository.checkAccess(
      userData.lastActiveWorkspaceId,
      ctx.session.user.id,
    );

    if (hasWorkspaceAccess) {
      lastActiveWorkspace = await ctx.db.query.workspace.findFirst({
        where: eq(workspace.id, userData.lastActiveWorkspaceId),
      });
    }
  }

  return {
    ...userData,
    accounts,
    lastActiveOrganization,
    lastActiveWorkspace,
  };
});
