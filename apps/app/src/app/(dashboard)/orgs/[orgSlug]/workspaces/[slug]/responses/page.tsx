import { notFound } from "next/navigation";
import { api, getQueryClient, HydrateClient, trpc } from "~/trpc/server";
import { ResponsesPageClient } from "./responses-page-client";

export default async function ResponsesPage({
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
  await Promise.all([
    queryClient.prefetchQuery(
      trpc.vacancy.listActive.queryOptions({
        workspaceId: workspace.id,
        limit: 100,
      }),
    ),
    queryClient.prefetchQuery(
      trpc.vacancy.responses.listWorkspace.queryOptions({
        workspaceId: workspace.id,
        page: 1,
        limit: 50,
        sortField: null,
        sortDirection: "desc",
        screeningFilter: "all",
        statusFilter: undefined,
        vacancyIds: undefined,
        search: undefined,
      }),
    ),
  ]);

  return (
    <HydrateClient>
      <ResponsesPageClient />
    </HydrateClient>
  );
}
