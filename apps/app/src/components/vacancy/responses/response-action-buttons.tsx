import { Button } from "@qbs-autonaim/ui";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

interface ResponseActionButtonsProps {
  totalResponses: number;
  isRefreshing: boolean;
  isProcessingNew: boolean;
  isProcessingAll: boolean;
  isRefreshingAllResumes: boolean;
  isSyncingArchived: boolean;
  onRefreshDialogOpen: () => void;
  onSyncArchivedDialogOpen: () => void;
  onRefreshAllResumesDialogOpen: () => void;
  onScreenNewDialogOpen: () => void;
  onScreenAllDialogOpen: () => void;
}

export function ResponseActionButtons({
  totalResponses,
  isRefreshing,
  isProcessingNew,
  isProcessingAll,
  isRefreshingAllResumes,
  isSyncingArchived,
  onRefreshDialogOpen,
  onSyncArchivedDialogOpen,
  onRefreshAllResumesDialogOpen,
  onScreenNewDialogOpen,
  onScreenAllDialogOpen,
}: ResponseActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={isRefreshing}
        variant="outline"
        size="sm"
        onClick={onRefreshDialogOpen}
        className="h-9 bg-background/60 border-border/60 hover:bg-background/80 transition-colors"
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {isRefreshing ? "Обновление..." : "Синхронизировать"}
      </Button>

      <Button
        disabled={isSyncingArchived}
        variant="outline"
        size="sm"
        onClick={onSyncArchivedDialogOpen}
        className="h-9 bg-background/60 border-border/60 border-dashed hover:bg-background/80 transition-colors"
      >
        {isSyncingArchived ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {isSyncingArchived ? "Синхронизация..." : "Архивные"}
      </Button>

      <Button
        disabled={isRefreshingAllResumes}
        variant="outline"
        size="sm"
        onClick={onRefreshAllResumesDialogOpen}
        className="h-9 bg-background/60 border-border/60 border-dashed hover:bg-background/80 transition-colors"
      >
        {isRefreshingAllResumes ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {isRefreshingAllResumes ? "Обновление..." : "Обновить резюме"}
      </Button>

      <Button
        disabled={isProcessingNew}
        variant="outline"
        size="sm"
        onClick={onScreenNewDialogOpen}
        className="h-9 bg-background/60 border-border/60 border-dashed hover:bg-background/80 transition-colors"
      >
        {isProcessingNew ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Оценить новые
      </Button>

      <Button
        disabled={isProcessingAll}
        variant="default"
        size="sm"
        onClick={onScreenAllDialogOpen}
        className="h-9 shadow-sm hover:shadow transition-shadow"
      >
        {isProcessingAll ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Оценить всех ({totalResponses})
      </Button>
    </div>
  );
}