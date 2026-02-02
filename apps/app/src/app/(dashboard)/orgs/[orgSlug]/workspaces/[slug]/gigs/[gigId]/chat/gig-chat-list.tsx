"use client";

import Button from "@qbs-autonaim/ui/button";
import Skeleton from "@qbs-autonaim/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

interface GigChatListProps {
  gigId: string;
}

export function GigChatList({ gigId }: GigChatListProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;

  const gigQuery = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
    staleTime: 30000,
  });

  const sessionsQuery = useQuery({
    ...trpc.chat.listSessions.queryOptions({
      entityType: "gig",
      entityId: gigId,
      limit: 20,
    }),
    staleTime: 10000,
  });

  const createSessionMutation = useMutation(
    trpc.chat.createSession.mutationOptions({
      onSuccess: (session) => {
        queryClient.invalidateQueries({
          queryKey: trpc.chat.listSessions.queryKey({
            entityType: "gig",
            entityId: gigId,
            limit: 20,
          }),
        });

        if (!orgSlug || !workspaceSlug) return;

        router.push(
          `/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/chat/${session.id}`,
        );
      },
    }),
  );

  if (!orgSlug || !workspaceSlug) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-3 md:px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
            >
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>

            <div className="min-w-0">
              <div className="text-lg md:text-xl font-semibold truncate">
                AI Помощник
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {gigQuery.data?.title ?? "Задание"}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() =>
              createSessionMutation.mutate({
                entityType: "gig",
                entityId: gigId,
              })
            }
            disabled={createSessionMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
            Новый
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessionsQuery.isPending ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }, (_, index) => `s-${index}`).map(
              (key) => (
                <div key={key} className="px-3 md:px-4 py-3 border-b">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ),
            )}
          </div>
        ) : sessionsQuery.data?.sessions?.length ? (
          sessionsQuery.data.sessions.map((session) => {
            const href = `/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/chat/${session.id}`;
            const isActive = pathname === href;

            const title = session.title || "Диалог";
            const lastMessageTime = session.lastMessageAt
              ? format(session.lastMessageAt, "HH:mm", { locale: ru })
              : format(session.createdAt, "HH:mm", { locale: ru });

            return (
              <Link key={session.id} href={href}>
                <div
                  className={`flex items-start gap-2 md:gap-3 px-3 md:px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b ${
                    isActive ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-semibold truncate text-sm md:text-base">
                        {title}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {lastMessageTime}
                      </span>
                    </div>

                    {session.lastMessage?.content ? (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {session.lastMessage.role === "assistant" && "AI: "}
                        {session.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        Нет сообщений
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Диалогов пока нет
              </p>
              <Button
                onClick={() =>
                  createSessionMutation.mutate({
                    entityType: "gig",
                    entityId: gigId,
                  })
                }
                disabled={createSessionMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Создать первый диалог
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

