import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@qbs-autonaim/ui";

interface GigImportDialogsProps {
  isConfirmNewDialogOpen: boolean;
  onConfirmNewDialogChange: (open: boolean) => void;
  onConfirmNew: () => void;

  isUrlDialogOpen: boolean;
  onUrlDialogChange: (open: boolean) => void;
  gigUrl: string;
  onGigUrlChange: (url: string) => void;
  urlError: string;
  onUrlErrorChange: (error: string) => void;
  onConfirmUrl: () => void;
}

export function GigImportDialogs({
  isConfirmNewDialogOpen,
  onConfirmNewDialogChange,
  onConfirmNew,
  isUrlDialogOpen,
  onUrlDialogChange,
  gigUrl,
  onGigUrlChange,
  urlError,
  onUrlErrorChange,
  onConfirmUrl,
}: GigImportDialogsProps) {
  return (
    <>
      <Dialog
        open={isConfirmNewDialogOpen}
        onOpenChange={onConfirmNewDialogChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение импорта</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите загрузить активные проекты с подключенных
              платформ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              Будет загружен список ваших активных проектов. Существующие
              проекты будут обновлены.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onConfirmNewDialogChange(false)}
            >
              Отмена
            </Button>
            <Button onClick={onConfirmNew}>Запустить импорт</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUrlDialogOpen} onOpenChange={onUrlDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить проект по ссылке</DialogTitle>
            <DialogDescription>
              Введите ссылку на проект (например,
              https://kwork.ru/project/12345)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gig-url">Ссылка на проект</Label>
              <Input
                id="gig-url"
                placeholder="https://kwork.ru/project/12345"
                value={gigUrl}
                onChange={(e) => {
                  onGigUrlChange(e.target.value);
                  onUrlErrorChange("");
                }}
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onUrlDialogChange(false);
                onGigUrlChange("");
                onUrlErrorChange("");
              }}
            >
              Отмена
            </Button>
            <Button onClick={onConfirmUrl}>Импортировать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
