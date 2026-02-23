import { notFound } from "next/navigation";
import { api, HydrateClient, makeQueryClient, orpc } from "~/orpc/server";
import { VacanciesPageClient } from "./vacancies-page-client";

export default async function VacanciesPage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug } = await params;
  const organization = await api.organization.getBySlug({
    slug: orgSlug,
  });
  if (!organization) notFound();

  const workspace = await api.organization.getWorkspaceBySlug({
    organizationId: organization.id,
    slug,
  });
  if (!workspace) notFound();

  const queryClient = makeQueryClient();
  const queryOptions = orpc.freelancePlatforms.getVacancies.queryOptions({
    input: {
      workspaceId: workspace.id,
      statusFilter: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 50,
    },
  });
  await queryClient.prefetchQuery(queryOptions);

  return (
    <HydrateClient>
      <VacanciesPageClient />
    </HydrateClient>
  );
}
