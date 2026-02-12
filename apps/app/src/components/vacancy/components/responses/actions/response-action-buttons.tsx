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
  isSyncingArchived: boolean;
  isReanalyzing: boolean;
  onRefreshDialogOpen: () => void;
  onSyncArchivedDialogOpen: () => void;
  onReanalyzeDialogOpen: () => void;
  onAnalyzeNewDialogOpen: () => void;
  isHHVacancy?: boolean;
  isArchivedPublication?: boolean;
  hasResponses?: boolean;
}

export function ResponseActionButtons({
  isRefreshing,
  isSyncingArchived,
  isReanalyzing,
  onRefreshDialogOpen,
  onSyncArchivedDialogOpen,
  onReanalyzeDialogOpen,
  onAnalyzeNewDialogOpen,
  isHHVacancy = false,
  isArchivedPublication = false,
  hasResponses = false,
}: ResponseActionButtonsProps) {
  const isAnyRefreshing = isRefreshing || isSyncingArchived || isReanalyzing;

  // Для HH вакансий показываем кнопки в зависимости от статуса публикации
  if (isHHVacancy) {
    return (
      <div className="flex items-center gap-2">
        {isArchivedPublication ? (
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
        ) : (
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
        )}

        {hasResponses &&
          (isArchivedPublication ? (
            <Button
              disabled={isAnyRefreshing}
              size="sm"
              onClick={onReanalyzeDialogOpen}
              className="h-9"
              aria-label="Проанализировать все отклики"
            >
              {isReanalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isReanalyzing ? "Анализ..." : "Проанализировать все отклики"}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isAnyRefreshing}
                  size="sm"
                  className="h-9"
                  aria-label="Меню анализа откликов"
                >
                  {isReanalyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isReanalyzing ? "Анализ..." : "Анализ"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={onAnalyzeNewDialogOpen}
                  disabled={isAnyRefreshing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Проанализировать новые отклики
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onReanalyzeDialogOpen}
                  disabled={isAnyRefreshing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Проанализировать все отклики
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
      </div>
    );
  }

  // Не должно быть достижимо, так как сейчас только HH вакансии
  return null;
}
