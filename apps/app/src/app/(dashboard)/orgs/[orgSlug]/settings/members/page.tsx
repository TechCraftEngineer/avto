import { paths } from "@qbs-autonaim/config";
import { OrganizationRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";

import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";

const organizationRepository = new OrganizationRepository(db);

import { OrganizationMembersClient } from "~/components/organization";

export default async function OrganizationMembersPage({
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

  const access = await organizationRepository.checkAccess(
    organization.id,
    session.user.id,
  );

  if (!access) {
    redirect(paths.accessDenied);
  }

  return (
    <div className="container mx-auto py-8">
      <OrganizationMembersClient
        organizationId={organization.id}
        currentUserId={session.user.id}
        currentUserRole={access.role}
      />
    </div>
  );
}
