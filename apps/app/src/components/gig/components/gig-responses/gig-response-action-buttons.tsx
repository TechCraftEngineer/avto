"use client";

import { Button } from "@qbs-autonaim/ui/components/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@qbs-autonaim/ui/components/tooltip";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

interface GigResponseActionButtonsProps {
  isSyncing: boolean;
  isAnalyzing: boolean;
  onSync: () => void;
  onAnalyze: () => void;
  canSync: boolean;
  hasResponses: boolean;
}

export function GigResponseActionButtons({
  isSyncing,
  isAnalyzing,
  onSync,
  onAnalyze,
  canSync,
  hasResponses,
}: GigResponseActionButtonsProps) {
  const isAnyLoading = isSyncing || isAnalyzing;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 shrink-0">
        {canSync && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={isAnyLoading}
                variant="outline"
                size="sm"
                onClick={onSync}
                className="h-9 min-w-[44px] sm:min-w-0 bg-background/60 border-border/60 hover:bg-background/80 transition-colors touch-manipulation"
                aria-label="Обновить отклики с платформы"
              >
                {isSyncing ? (
                  <Loader2
                    className="h-4 w-4 sm:mr-2 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <RefreshCw className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {isSyncing ? "Загрузка…" : "Обновить отклики"}
                </span>
                <span className="sm:hidden">
                  {isSyncing ? "Загрузка…" : "Обновить"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p>Загрузить новые отклики с фриланс-платформы (Kwork и др.)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {hasResponses && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={isAnyLoading}
                size="sm"
                onClick={onAnalyze}
                className="h-9 min-w-[44px] sm:min-w-0 touch-manipulation"
                aria-label="Проанализировать все отклики"
              >
                {isAnalyzing ? (
                  <Loader2
                    className="h-4 w-4 sm:mr-2 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Sparkles className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {isAnalyzing ? "Анализ…" : "Проанализировать отклики"}
                </span>
                <span className="sm:hidden">
                  {isAnalyzing ? "Анализ…" : "Анализ"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px]">
              <p>
                Запустить AI-анализ всех откликов и пересчёт рейтинга кандидатов
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
