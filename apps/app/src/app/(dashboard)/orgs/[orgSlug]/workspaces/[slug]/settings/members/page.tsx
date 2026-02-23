import { paths } from "@qbs-autonaim/config";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { WorkspaceMembersClient } from "~/components";
import { api } from "~/orpc/server";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string; orgSlug: string }>;
}) {
  const { slug: workspaceSlug, orgSlug } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  const orgData = await api.organization.getBySlug({ slug: orgSlug });
  const workspaceData = await api.workspace.getBySlug({
    slug: workspaceSlug,
    organizationId: orgData.id,
  });

  return (
    <WorkspaceMembersClient
      workspaceId={workspaceData.workspace.id}
      currentUserId={session.user.id}
    />
  );
}
