import { XCircle } from "lucide-react";
import type { ResultData } from "./types";

interface RefreshResultContentProps {
  result: ResultData;
}

export function RefreshResultContent({ result }: RefreshResultContentProps) {
  if (result.success) {
    return (
      <div className="space-y-3 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-3 mt-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {result.totalResponses || 0}
            </div>
            <div className="text-xs text-muted-foreground">Всего откликов</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {result.newCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">Новых добавлено</div>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground pt-2 border-t">
          Закроется автоматически через 10 секунд
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 mt-2">
      <div className="flex items-center gap-2 text-destructive mb-1">
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Не удалось получить отклики</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {result.error || "Произошла неизвестная ошибка"}
      </p>
    </div>
  );
}
