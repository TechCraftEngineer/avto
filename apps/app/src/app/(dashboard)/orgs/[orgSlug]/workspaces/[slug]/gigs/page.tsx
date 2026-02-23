import { notFound } from "next/navigation";
import { use } from "react";
import { api, HydrateClient, makeQueryClient, orpc } from "~/orpc/server";
import { GigsPageClient } from "./gigs-page-client";

export default function GigsPage({
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
  use(
    queryClient.prefetchQuery(
      orpc.gig.list.queryOptions({ input: { workspaceId: workspace.id } }),
    ),
  );

  return (
    <HydrateClient>
      <GigsPageClient />
    </HydrateClient>
  );
}
