import { notFound } from "next/navigation";
import { api, getQueryClient, HydrateClient, orpc } from "~/orpc/server";
import { GigsPageClient } from "./gigs-page-client";

export default async function GigsPage({
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
  await queryClient.prefetchQuery(
    orpc.gig.list.queryOptions({ workspaceId: workspace.id }),
  );

  return (
    <HydrateClient>
      <GigsPageClient />
    </HydrateClient>
  );
}
