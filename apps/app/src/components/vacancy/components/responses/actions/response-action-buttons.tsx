import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";

interface ResponseActionButtonsProps {
  isRefreshing: boolean;
  isSyncingArchived: boolean;
  onRefreshDialogOpen: () => void;
  onSyncArchivedDialogOpen: () => void;
  isHHVacancy?: boolean;
  isArchivedPublication?: boolean;
}

export function ResponseActionButtons({
  isRefreshing,
  isSyncingArchived,
  onRefreshDialogOpen,
  onSyncArchivedDialogOpen,
  isHHVacancy = false,
  isArchivedPublication = false,
}: ResponseActionButtonsProps) {
  const isAnyRefreshing = isRefreshing || isSyncingArchived;

  // Для архивных вакансий HH показываем только кнопку загрузки архивных откликов
  // Для активных вакансий HH показываем только кнопку обновления откликов
  const showOnlyArchived = isHHVacancy && isArchivedPublication;
  const showOnlyRefresh = isHHVacancy && !isArchivedPublication;

  return (
    <div className="flex items-center gap-2">
      {showOnlyArchived ? (
        // Только кнопка для архивных откликов
        <Button
          disabled={isAnyRefreshing}
          variant="outline"
          size="sm"
          onClick={onSyncArchivedDialogOpen}
          className="h-9 bg-background/60 border-border/60 hover:bg-background/80 transition-colors"
        >
          {isSyncingArchived ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isSyncingArchived ? "Загрузка..." : "Загрузить архивные отклики"}
        </Button>
      ) : showOnlyRefresh ? (
        // Только кнопка для новых откликов
        <Button
          disabled={isAnyRefreshing}
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
          {isRefreshing ? "Загрузка..." : "Обновить отклики"}
        </Button>
      ) : (
        // Обе опции с dropdown (для не-HH вакансий)
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
      )}
    </div>
  );
}
