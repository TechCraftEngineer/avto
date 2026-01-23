import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui";
import { Loader2 } from "lucide-react";

interface RefreshDialogProps {
  open: boolean;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function RefreshDialog({
  open,
  status,
  message,
  error,
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
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{message || "Запускаем получение откликов..."}</span>
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
