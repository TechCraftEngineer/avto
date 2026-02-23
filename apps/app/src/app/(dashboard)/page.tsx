import { paths } from "@qbs-autonaim/config";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { client } from "~/orpc/react";

export default async function Page() {
  const session = await getSession();

  // Редирект на /auth/signin обрабатывается в proxy
  if (!session?.user) {
    return null;
  }

  // Получаем данные пользователя с последним активным воркспейсом
  const userData = await client.user.me();

  // Если есть последний активный воркспейс, редирект на него
  if (userData?.lastActiveWorkspace && userData?.lastActiveOrganization) {
    redirect(
      paths.workspace.root(
        userData.lastActiveOrganization.slug,
        userData.lastActiveWorkspace.slug,
      ),
    );
  }

  // Получаем workspaces пользователя
  const userWorkspaces = await client.workspace.list();

  // Если есть workspaces, редирект на первый
  const firstWorkspace = userWorkspaces[0];
  if (firstWorkspace?.workspace.organization?.slug) {
    redirect(
      paths.workspace.root(
        firstWorkspace.workspace.organization.slug,
        firstWorkspace.workspace.slug,
      ),
    );
  }

  // Проверяем наличие pending invitations
  const pendingInvites = await client.workspace.invites.pending();
  if (pendingInvites.length > 0) {
    redirect(paths.invitations.root);
  }

  // Если нет workspaces и нет приглашений, редирект на создание
  redirect(paths.onboarding.root);
}
