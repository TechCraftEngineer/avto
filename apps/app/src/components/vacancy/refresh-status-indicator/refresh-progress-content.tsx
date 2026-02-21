import { Progress } from "@qbs-autonaim/ui/components/progress";
import type { ProgressData } from "./types";

interface RefreshProgressContentProps {
  progress: ProgressData;
}

export function RefreshProgressContent({
  progress,
}: RefreshProgressContentProps) {
  return (
    <>
      <p className="text-xs text-muted-foreground mb-2">{progress.message}</p>

      {progress.status === "processing" &&
        progress.currentPage !== undefined && (
          <div className="space-y-2 mb-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-3 font-mono">
                <span className="text-green-600 dark:text-green-400">
                  Новых: {progress.totalSaved || 0}
                </span>
                <span className="text-muted-foreground">
                  Пропущено: {progress.totalSkipped || 0}
                </span>
              </div>
            </div>
            <Progress value={undefined} className="h-1.5" />
          </div>
        )}

      {progress.status === "error" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 mt-2">
          <p className="text-xs text-destructive">{progress.message}</p>
        </div>
      )}
    </>
  );
}
