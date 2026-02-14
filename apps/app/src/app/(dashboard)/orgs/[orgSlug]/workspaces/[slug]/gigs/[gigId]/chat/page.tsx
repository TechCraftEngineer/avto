"use client";

import { Button } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

export default function GigChatPage() {
  const trpc = useTRPC();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const params = useParams();
  const gigId = params.gigId as string | undefined;
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;

  const gigQuery = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId ?? "",
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(gigId) && Boolean(workspaceId),
    staleTime: 30000,
  });

  if (!orgSlug || !workspaceSlug || !gigId) {
    return null;
  }

  const gigHref = `/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`;

  return (
    <div className="flex h-full items-center justify-center p-6 w-full">
      <div className="text-center">
        <div className="mb-2 text-base font-semibold">AI Помощник</div>
        <div className="mb-6 text-sm text-muted-foreground">
          {gigQuery.data?.title ?? "Задание"}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
          <Button asChild variant="outline">
            <Link href={gigHref}>
              <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />К
              заданию
            </Link>
          </Button>
          <Button asChild>
            <Link href={`${gigHref}/responses`}>
              <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
              Отклики
            </Link>
          </Button>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          Выберите диалог слева или создайте новый.
        </div>
      </div>
    </div>
  );
}
