import { notFound } from "next/navigation";
import { api, getQueryClient, HydrateClient, orpc } from "~/orpc/server";
import { VacanciesPageClient } from "./vacancies-page-client";

export default async function VacanciesPage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug } = await params;
  const caller = await api();
  const organization = await caller.organization.getBySlug({ slug: orgSlug });
  if (!organization) notFound();

  const workspace = await caller.organization.getWorkspaceBySlug({
    organizationId: organization.id,
    slug,
  });
  if (!workspace) notFound();

  const queryClient = getQueryClient();
  const queryOptions = orpc.freelancePlatforms.getVacancies.queryOptions({
    workspaceId: workspace.id,
    statusFilter: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 50,
  });
  await queryClient.prefetchQuery(queryOptions);

  return (
    <HydrateClient>
      <VacanciesPageClient />
    </HydrateClient>
  );
}
