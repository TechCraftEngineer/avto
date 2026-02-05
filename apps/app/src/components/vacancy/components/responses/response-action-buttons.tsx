import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui";
import { ChevronDown, Loader2, RefreshCw, Sparkles } from "lucide-react";

interface ResponseActionButtonsProps {
  isRefreshing: boolean;
  isProcessingNew: boolean;
  isSyncingArchived: boolean;
  onRefreshDialogOpen: () => void;
  onSyncArchivedDialogOpen: () => void;
  onScreenNewDialogOpen: () => void;
}

export function ResponseActionButtons({
  isRefreshing,
  isProcessingNew,
  isSyncingArchived,
  onRefreshDialogOpen,
  onSyncArchivedDialogOpen,
  onScreenNewDialogOpen,
}: ResponseActionButtonsProps) {
  const isAnyRefreshing = isRefreshing || isSyncingArchived;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <div className="flex items-center">
          <Button
            disabled={isAnyRefreshing}
            variant="outline"
            size="sm"
            onClick={onRefreshDialogOpen}
            className="h-9 bg-background/60 border-border/60 hover:bg-background/80 transition-colors rounded-r-none border-r-0"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRefreshing ? "Загрузка..." : "Обновить отклики"}
          </Button>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isAnyRefreshing}
              variant="outline"
              size="sm"
              className="h-9 bg-background/60 border-border/60 hover:bg-background/80 transition-colors rounded-l-none px-2"
              aria-label="Открыть дополнительные действия"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onRefreshDialogOpen}
            disabled={isAnyRefreshing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Загрузить новые отклики
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onSyncArchivedDialogOpen}
            disabled={isAnyRefreshing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Загрузить архивные отклики
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        disabled={isProcessingNew}
        variant="default"
        size="sm"
        onClick={onScreenNewDialogOpen}
        className="h-9 shadow-sm hover:shadow transition-shadow"
      >
        {isProcessingNew ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        {isProcessingNew ? "Анализ..." : "Проанализировать"}
      </Button>
    </div>
  );
}
