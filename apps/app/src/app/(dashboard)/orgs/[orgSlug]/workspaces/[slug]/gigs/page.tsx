import { notFound } from "next/navigation";
import { api, HydrateClient, makeQueryClient, orpc } from "~/orpc/server";
import { GigsPageClient } from "./gigs-page-client";

export default async function GigsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug } = await params;
  const caller = api;
  const organization = await caller.organization.getBySlug({ slug: orgSlug });
  if (!organization) notFound();

  const workspace = await caller.organization.getWorkspaceBySlug({
    organizationId: organization.id,
    slug,
  });
  if (!workspace) notFound();

  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery(
    orpc.gig.list.queryOptions({ input: { workspaceId: workspace.id } }),
  );

  return (
    <HydrateClient>
      <GigsPageClient />
    </HydrateClient>
  );
}
