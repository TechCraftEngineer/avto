import { notFound } from "next/navigation";
import { api, HydrateClient, makeQueryClient, orpc } from "~/orpc/server";
import { ResponsesPageClient } from "./responses-page-client";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug } = await params;
  const organization = await api.organization.getBySlug({ slug: orgSlug });
  if (!organization) notFound();

  const workspace = await api.organization.getWorkspaceBySlug({
    organizationId: organization.id,
    slug,
  });
  if (!workspace) notFound();

  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(
      orpc.vacancy.listActive.queryOptions({
        input: { workspaceId: workspace.id, limit: 100 },
      }),
    ),
    queryClient.prefetchQuery(
      orpc.vacancy.responses.listWorkspace.queryOptions({
        input: {
          workspaceId: workspace.id,
          page: 1,
          limit: 50,
          sortField: null,
          sortDirection: "desc",
          screeningFilter: "all",
          statusFilter: undefined,
          vacancyIds: undefined,
          search: undefined,
        },
      }),
    ),
  ]);

  return (
    <HydrateClient>
      <ResponsesPageClient />
    </HydrateClient>
  );
}
