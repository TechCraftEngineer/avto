import { notFound } from "next/navigation";
import { use } from "react";
import { api, HydrateClient, makeQueryClient, orpc } from "~/orpc/server";
import { VacanciesPageClient } from "./vacancies-page-client";

export default function VacanciesPage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug } = use(params);
  const organization = use(api.organization.getBySlug({ slug: orgSlug }));
  if (!organization) notFound();

  const workspace = use(
    api.organization.getWorkspaceBySlug({
      organizationId: organization.id,
      slug,
    }),
  );
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
  use(queryClient.prefetchQuery(queryOptions));

  return (
    <HydrateClient>
      <VacanciesPageClient />
    </HydrateClient>
  );
}
