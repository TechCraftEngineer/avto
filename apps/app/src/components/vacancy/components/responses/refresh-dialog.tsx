import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
} from "@qbs-autonaim/ui";
import { Loader2 } from "lucide-react";
import type { RefreshProgress } from "./use-refresh-subscription";

interface RefreshDialogProps {
  open: boolean;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  error: string | null;
  progress: RefreshProgress | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function RefreshDialog({
  open,
  status,
  message,
  error,
  progress,
  onOpenChange,
  onConfirm,
  onClose,
}: RefreshDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Получение новых откликов</DialogTitle>
          <div>
            {status === "idle" && (
              <>
                Будет запущен процесс получения новых откликов с HeadHunter для
                этой вакансии. Процесс будет выполняться в фоновом режиме, и
                новые отклики появятся в таблице автоматически.
              </>
            )}
            {status === "loading" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{message || "Запускаем получение откликов..."}</span>
                </div>
                {progress && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Страница: {progress.currentPage + 1} • Новых:{" "}
                      {progress.totalSaved} • Пропущено: {progress.totalSkipped}
                    </div>
                    <Progress value={undefined} className="h-2" />
                  </div>
                )}
              </div>
            )}
            {status === "success" && (
              <div className="text-green-600">
                ✓{" "}
                {message ||
                  "Процесс успешно завершен! Новые отклики появятся в таблице автоматически."}
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
              <Button onClick={onConfirm}>Получить отклики</Button>
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
