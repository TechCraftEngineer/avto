import { paths } from "@qbs-autonaim/config";
import { OrganizationRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";

import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { PageHeader } from "~/components/layout";
import { OrganizationGeneralForm } from "~/components/organization/components";

const organizationRepository = new OrganizationRepository(db);

export default async function OrganizationSettingsPage({
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
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-2xl pl-8">
        <PageHeader
          title="Общие настройки"
          description="Управление основной информацией об организации"
        />
        <OrganizationGeneralForm
          initialData={{
            name: organization.name,
            slug: organization.slug,
            description: organization.description ?? undefined,
            website: organization.website ?? undefined,
            logo: organization.logo ?? undefined,
          }}
          organizationId={organization.id}
          userRole={access.role}
        />
      </div>
    </div>
  );
}
