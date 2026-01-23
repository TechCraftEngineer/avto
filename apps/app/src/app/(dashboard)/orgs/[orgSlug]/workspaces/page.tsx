import { paths } from "@qbs-autonaim/config";
import { OrganizationRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { WorkspaceListClient } from "~/components/workspace/workspace-list-client";

const organizationRepository = new OrganizationRepository(db);

export default async function WorkspacesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  const { orgSlug } = await params;

  const organization = await organizationRepository.findBySlug(orgSlug);
  if (!organization) {
    redirect(paths.dashboard.root);
  }

  // Проверяем доступ к организации
  const orgAccess = await organizationRepository.checkAccess(
    organization.id,
    session.user.id,
  );

  // Получаем доступные пользователю воркспейсы в этой организации
  const workspaces =
    await organizationRepository.getUserWorkspacesInOrganization(
      organization.id,
      session.user.id,
    );

  // Если нет доступа к организации И нет доступных воркспейсов, отказываем в доступе
  if (!orgAccess && workspaces.length === 0) {
    redirect(paths.accessDenied);
  }

  return (
    <WorkspaceListClient
      organizationId={organization.id}
      organizationSlug={organization.slug}
      initialWorkspaces={workspaces}
      userRole={orgAccess?.role || null}
    />
  );
}
