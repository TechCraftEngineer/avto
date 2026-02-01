import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui";
import { Loader2 } from "lucide-react";
import type { ScreeningProgress } from "./use-screening-subscription";

interface ScreeningDialogProps {
  open: boolean;
  title: string;
  description: string;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  error: string | null;
  progress: ScreeningProgress | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ScreeningDialog({
  open,
  title,
  description,
  status,
  message,
  error,
  progress,
  onOpenChange,
  onConfirm,
  onClose,
}: ScreeningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <div>
            {status === "idle" && <>{description}</>}
            {status === "loading" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{message || "Запускаем оценку откликов..."}</span>
                </div>
                {progress && progress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Прогресс:</span>
                      <span className="font-medium">
                        {progress.processed} / {progress.total}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.round((progress.processed / progress.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {status === "success" && (
              <div className="space-y-4">
                <div className="text-green-600">
                  ✓ {message || "Процесс успешно завершен!"}
                </div>
                {progress && (
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {progress.total}
                      </div>
                      <div className="text-xs text-muted-foreground">Всего</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {progress.processed}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Успешно
                      </div>
                    </div>
                    {progress.failed > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-destructive">
                          {progress.failed}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ошибок
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {status === "error" && (
              <div className="text-red-600">
                ✗ Ошибка: {error || "Не удалось запустить процесс"}
              </div>
            )}
          </div>
        </DialogHeader>
        <DialogFooter>
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button onClick={onConfirm}>Оценить отклики</Button>
            </>
          )}
          {status === "loading" && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Выполняется...
            </Button>
          )}
          {status === "success" && <Button onClick={onClose}>Закрыть</Button>}
          {status === "error" && (
            <Button variant="destructive" onClick={onClose}>
              Закрыть
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
