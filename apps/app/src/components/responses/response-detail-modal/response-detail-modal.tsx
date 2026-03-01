"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Dialog, DialogContent } from "@qbs-autonaim/ui/components/dialog";
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@qbs-autonaim/ui/components/sheet";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ResponseDetailCard } from "~/components/vacancy/components";
import { useMediaQuery } from "~/hooks/use-media-query";
import { useORPC } from "~/orpc/react";

interface ResponseDetailModalProps {
  responseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  /** Вызывается при Ctrl/Cmd+S для сохранения (когда есть редактирование) */
  onSave?: () => void;
}

export function ResponseDetailModal({
  responseId,
  open,
  onOpenChange,
  orgSlug,
  workspaceSlug,
  workspaceId,
  onSave,
}: ResponseDetailModalProps) {
  const orpc = useORPC();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onSave]);

  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...orpc.vacancy.responses.get.queryOptions({
      input: {
        id: responseId ?? "",
        workspaceId,
      },
    }),
    enabled: open && Boolean(responseId) && Boolean(workspaceId),
  });

  const { data: vacancyData } = useQuery({
    ...orpc.vacancy.get.queryOptions({
      input: {
        id: response?.entityId ?? "",
        workspaceId,
      },
    }),
    enabled:
      open &&
      Boolean(workspaceId) &&
      Boolean(response?.entityId) &&
      response?.entityType === "vacancy",
  });

  type ResponseWithGlobalCandidate = NonNullable<typeof response> & {
    globalCandidate: null;
  };

  const responseWithGlobalCandidate: ResponseWithGlobalCandidate | null =
    response
      ? {
          ...response,
          globalCandidate: null,
        }
      : null;

  const hasActions = !!response?.interviewSession;

  const content = (
    <div className="flex flex-col gap-4">
      {hasActions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b pb-4">
          <Button size="sm" asChild>
            <Link
              href={paths.workspace.chat(
                orgSlug,
                workspaceSlug,
                responseId ?? "",
              )}
              onClick={() => onOpenChange(false)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Открыть чат
            </Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <p className="text-sm font-medium">Не удалось загрузить отклик</p>
          {error && (
            <p className="text-xs">
              {error instanceof Error ? error.message : "Неизвестная ошибка"}
            </p>
          )}
        </div>
      ) : responseWithGlobalCandidate ? (
        <ResponseDetailCard
          response={responseWithGlobalCandidate}
          vacancy={vacancyData ?? undefined}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">Отклик не найден</p>
        </div>
      )}
    </div>
  );

  if (!open) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-[90vh] max-h-[90vh] w-[min(95vw,1600px)]! max-w-[min(95vw,1600px)]! flex-col overflow-hidden p-0 gap-0 overscroll-contain"
          showCloseButton={true}
        >
          <ScrollArea className="min-h-0 flex-1 overscroll-contain px-6 pt-14 pb-6">
            {content}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] w-full overflow-hidden flex flex-col p-0 gap-0 rounded-t-xl overscroll-contain"
        showCloseButton={true}
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3 text-left">
          <SheetTitle className="text-base font-semibold">
            {response?.candidateName ?? "Отклик"}
          </SheetTitle>
          {vacancyData?.title && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {vacancyData.title}
            </p>
          )}
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 overscroll-contain px-4 pb-4">
          {content}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
