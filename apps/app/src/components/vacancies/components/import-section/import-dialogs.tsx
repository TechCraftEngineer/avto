import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Label } from "@qbs-autonaim/ui/components/label";

interface ImportDialogsProps {
  // New vacancies dialog
  isConfirmNewDialogOpen: boolean;
  onConfirmNewDialogChange: (open: boolean) => void;
  onConfirmNew: () => void;
  currentPlatformName?: string;

  // Archived vacancies dialog
  isConfirmArchivedDialogOpen: boolean;
  onConfirmArchivedDialogChange: (open: boolean) => void;
  onConfirmArchived: () => void;

  // URL dialog
  isUrlDialogOpen: boolean;
  onUrlDialogChange: (open: boolean) => void;
  vacancyUrl: string;
  onVacancyUrlChange: (url: string) => void;
  urlError: string;
  onUrlErrorChange: (error: string) => void;
  onConfirmUrl: () => void;
}

export function ImportDialogs({
  isConfirmNewDialogOpen,
  onConfirmNewDialogChange,
  onConfirmNew,
  currentPlatformName,
  isConfirmArchivedDialogOpen,
  onConfirmArchivedDialogChange,
  onConfirmArchived,
  isUrlDialogOpen,
  onUrlDialogChange,
  vacancyUrl,
  onVacancyUrlChange,
  urlError,
  onUrlErrorChange,
  onConfirmUrl,
}: ImportDialogsProps) {
  return (
    <>
      {/* Confirm New Vacancies Dialog */}
      <Dialog
        open={isConfirmNewDialogOpen}
        onOpenChange={onConfirmNewDialogChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбор активных вакансий</DialogTitle>
            <DialogDescription>
              Сейчас будет загружен список активных вакансий для выбора
              {currentPlatformName ? ` с платформы ${currentPlatformName}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              Система загрузит список ваших активных вакансий, и вы сможете
              выбрать, какие из них импортировать.
            </p>
            <p className="text-sm text-muted-foreground">
              Это позволит избежать загрузки ненужных данных и сэкономит время.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onConfirmNewDialogChange(false)}
            >
              Отмена
            </Button>
            <Button onClick={onConfirmNew}>Продолжить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Archived Vacancies Dialog */}
      <Dialog
        open={isConfirmArchivedDialogOpen}
        onOpenChange={onConfirmArchivedDialogChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбор архивных вакансий</DialogTitle>
            <DialogDescription>
              Сейчас будет загружен список архивных вакансий для выбора
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              Система загрузит список ваших архивных вакансий, и вы сможете
              выбрать, какие из них импортировать.
            </p>
            <p className="text-sm text-muted-foreground">
              Это позволит избежать загрузки ненужных данных и сэкономит время.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onConfirmArchivedDialogChange(false)}
            >
              Отмена
            </Button>
            <Button onClick={onConfirmArchived}>Продолжить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL Input Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={onUrlDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить вакансию по ссылке</DialogTitle>
            <DialogDescription>
              Введите ссылку на вакансию с платформы подбора персонала
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vacancy-url">Ссылка на вакансию</Label>
              <Input
                id="vacancy-url"
                placeholder="https://hh.ru/vacancy/12345678"
                value={vacancyUrl}
                onChange={(e) => {
                  onVacancyUrlChange(e.target.value);
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
                onVacancyUrlChange("");
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
