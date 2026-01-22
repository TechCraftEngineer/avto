import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui";
import { Loader2 } from "lucide-react";

interface SyncArchivedDialogProps {
  open: boolean;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  error: string | null;
  syncedCount?: number;
  newCount?: number;
  vacancyTitle?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function SyncArchivedDialog({
  open,
  status,
  message,
  error,
  syncedCount,
  newCount,
  vacancyTitle,
  onOpenChange,
  onConfirm,
  onClose,
}: SyncArchivedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Синхронизация архивных откликов</DialogTitle>
          <div>
            {status === "idle" && (
              <>
                Будет запущен процесс получения ВСЕХ откликов с HeadHunter для
                этой вакансии, включая архивные. Это может занять
                продолжительное время в зависимости от количества откликов.
              </>
            )}
            {status === "loading" && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {message || "Запускаем синхронизацию архивных откликов..."}
                </span>
              </div>
            )}
            {status === "success" && (
              <div className="space-y-2">
                <div className="text-green-600">
                  ✓ Синхронизация успешно завершена!
                </div>
                <div className="text-sm text-muted-foreground">
                  {vacancyTitle && (
                    <div className="font-medium">{vacancyTitle}</div>
                  )}
                  <div>Всего обработано: {syncedCount || 0} откликов</div>
                  <div>Новых добавлено: {newCount || 0} откликов</div>
                </div>
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
              <Button onClick={onConfirm}>Синхронизировать архивные</Button>
            </>
          )}
          {status === "loading" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Синхронизируется...
              </Button>
            </>
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
