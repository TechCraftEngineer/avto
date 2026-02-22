import { eq } from "@qbs-autonaim/db";
import {
  account,
  organization,
  user,
  workspace,
} from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../orpc";

export const me = protectedProcedure.handler(async ({ context }) => {
  const userData = await context.db.query.user.findFirst({
    where: eq(user.id, context.session.user.id),
  });

  if (!userData) return null;

  const accounts = await context.db.query.account.findMany({
    where: eq(account.userId, context.session.user.id),
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
    const hasOrgAccess = await context.organizationRepository.checkAccess(
      userData.lastActiveOrganizationId,
      context.session.user.id,
    );

    if (hasOrgAccess) {
      lastActiveOrganization = await context.db.query.organization.findFirst({
        where: eq(organization.id, userData.lastActiveOrganizationId),
      });
    }
  }

  if (userData.lastActiveWorkspaceId) {
    // Проверяем доступ к workspace
    const hasWorkspaceAccess = await context.workspaceRepository.checkAccess(
      userData.lastActiveWorkspaceId,
      context.session.user.id,
    );

    if (hasWorkspaceAccess) {
      lastActiveWorkspace = await context.db.query.workspace.findFirst({
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
