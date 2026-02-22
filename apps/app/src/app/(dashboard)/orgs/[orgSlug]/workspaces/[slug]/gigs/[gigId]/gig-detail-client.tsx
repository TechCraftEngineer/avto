"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@qbs-autonaim/ui/components/alert-dialog";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Mail,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  GigDetailActions,
  GigDetailHeader,
  GigDetailProjectDetails,
  GigDetailSkeleton,
  GigError,
  GigInterviewSettings,
  GigInvitationTemplate,
  GigNotFound,
  GigRequirements,
} from "~/components";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

interface GigDetailClientProps {
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

export function GigDetailClient({
  orgSlug,
  workspaceSlug,
  gigId,
}: GigDetailClientProps) {
  const orpc = useORPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    workspace,
    organization,
    isLoading: workspaceLoading,
    organizationIsLoading,
  } = useWorkspace();
  const workspaceId = workspace?.id;

  const {
    data: gig,
    isPending,
    error,
    isError,
  } = useQuery({
    ...orpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  // Update document title for SEO
  useEffect(() => {
    if (gig?.title) {
      document.title = `${gig.title} | Разовое задание`;
    }
  }, [gig]);

  const { data: responseCounts } = useQuery({
    ...orpc.gig.responses.count.queryOptions({
      gigId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation(
    orpc.gig.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Задание удалено");
        queryClient.invalidateQueries({
          queryKey: orpc.gig.list.queryKey(),
        });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`);
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось удалить задание");
      },
    }),
  );

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Ссылка скопирована в буфер обмена");
      })
      .catch(() => {
        toast.error("Не удалось скопировать ссылку");
      });
  }, [orgSlug, workspaceSlug, gigId]);

  const handleSettings = useCallback(() => {
    toast.info("Функция «Настройки» скоро будет доступна");
  }, []);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!workspaceId) return;
    deleteMutation.mutate({ gigId, workspaceId });
  }, [workspaceId, gigId, deleteMutation]);

  if (workspaceLoading || organizationIsLoading || isPending) {
    return <GigDetailSkeleton />;
  }

  if (!workspace || !organization) {
    return <GigDetailSkeleton />;
  }

  if (isError || error) {
    return (
      <GigError
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        error={error ? new Error(error.message) : null}
      />
    );
  }

  if (!gig) {
    return <GigNotFound orgSlug={orgSlug} workspaceSlug={workspaceSlug} />;
  }

  return (
    <div className="container mx-auto max-w-[1600px] w-full py-4 px-4 sm:py-6 sm:px-6">
      <nav className="mb-4 sm:mb-6" aria-label="Навигация">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:text-foreground transition-colors touch-manipulation min-h-11 sm:min-h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад к заданиям
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <GigDetailHeader
            gig={gig}
            orgSlug={orgSlug}
            workspaceSlug={workspaceSlug}
            gigId={gigId}
            onShare={handleShare}
            onSettings={handleSettings}
            onDeleteClick={handleDeleteClick}
          />

          <Tabs defaultValue="project" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto gap-1 p-1.5 bg-muted/50 rounded-lg mb-4">
              <TabsTrigger
                value="project"
                className="min-h-11 sm:min-h-9 gap-2 touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-medium"
              >
                <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">О проекте</span>
                <span className="sm:hidden">Проект</span>
              </TabsTrigger>
              <TabsTrigger
                value="interview"
                className="min-h-11 sm:min-h-9 gap-2 touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-medium"
              >
                <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Интервью</span>
              </TabsTrigger>
              <TabsTrigger
                value="invitation"
                className="min-h-11 sm:min-h-9 gap-2 touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-medium"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Приглашение</span>
                <span className="sm:hidden">Шаблон</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="project" className="mt-0 space-y-6">
              <GigRequirements requirements={gig.requirements} />
              {gig.url && (
                <Card>
                  <CardHeader className="px-4 py-4 sm:px-5 sm:py-4">
                    <CardTitle className="text-lg sm:text-xl">
                      Внешняя ссылка
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <Button
                      variant="outline"
                      asChild
                      className="w-full sm:w-auto min-h-11 touch-manipulation"
                    >
                      <a
                        href={gig.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink
                          className="h-4 w-4 mr-2"
                          aria-hidden="true"
                        />
                        Открыть на {gig.source}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="interview" className="mt-0">
              <GigInterviewSettings gigId={gigId} />
            </TabsContent>

            <TabsContent value="invitation" className="mt-0">
              <GigInvitationTemplate gigId={gigId} gigTitle={gig.title} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6" aria-label="Дополнительная информация">
          <GigDetailProjectDetails
            budgetMin={gig.budgetMin}
            budgetMax={gig.budgetMax}
            estimatedDuration={gig.estimatedDuration}
            deadline={gig.deadline}
          />

          <GigDetailActions
            gig={gig}
            orgSlug={orgSlug}
            workspaceSlug={workspaceSlug}
            gigId={gigId}
            responseCounts={responseCounts}
            onShare={handleShare}
          />
        </aside>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задание?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить задание «{gig.title}». Все отклики на это
              задание также будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Удаление…" : "Удалить задание"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
