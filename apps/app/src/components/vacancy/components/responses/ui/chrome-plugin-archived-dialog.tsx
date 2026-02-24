"use client";

/**
 * Диалог с информацией о загрузке архивных откликов через расширение Chrome.
 * Старый flow (синхронизация через API) заархивирован — см. _archived/README.md
 */

const EXTENSION_INSTALL_URL =
  "https://chromewebstore.google.com/detail/recruitment-assistant";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import { ExternalLink, Puzzle } from "lucide-react";

interface ChromePluginArchivedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChromePluginArchivedDialog({
  open,
  onOpenChange,
}: ChromePluginArchivedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Puzzle className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle>Загрузка архивных откликов</DialogTitle>
              <DialogDescription>
                Вы можете загрузить архивные отклики через расширение «Помощник
                рекрутера» в Chrome. Откройте страницу вакансии на hh.ru и
                экспортируйте отклики прямо со страницы работодателя.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p className="mb-2 font-medium">Как загрузить отклики:</p>
            <ol className="space-y-1 text-muted-foreground">
              <li>1. Установите расширение «Помощник рекрутера» в Chrome</li>
              <li>2. Откройте страницу архивной вакансии на hh.ru/employer</li>
              <li>
                3. Используйте расширение для экспорта откликов в Selectio
              </li>
            </ol>
          </div>

          <div className="flex justify-end">
            <Button asChild>
              <a
                href={EXTENSION_INSTALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Установить расширение
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
