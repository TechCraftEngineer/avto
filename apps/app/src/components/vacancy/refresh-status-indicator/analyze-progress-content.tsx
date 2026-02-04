import type { AnalyzeCompletedData, AnalyzeProgressData } from "./types";

interface AnalyzeProgressContentProps {
  progress: AnalyzeProgressData | null;
  completed: AnalyzeCompletedData | null;
}

export function AnalyzeProgressContent({
  progress,
  completed,
}: AnalyzeProgressContentProps) {
  if (completed) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Проанализировано откликов: {completed.successful} из {completed.total}
        </p>
        {completed.failed > 0 && (
          <p className="text-xs text-destructive">Ошибок: {completed.failed}</p>
        )}
      </div>
    );
  }

  if (progress) {
    const percentage = Math.round((progress.processed / progress.total) * 100);

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Обработано: {progress.processed} из {progress.total}
        </p>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Успешно: {progress.successful}</span>
          {progress.failed > 0 && (
            <span className="text-destructive">Ошибок: {progress.failed}</span>
          )}
        </div>
      </div>
    );
  }

  return null;
}
