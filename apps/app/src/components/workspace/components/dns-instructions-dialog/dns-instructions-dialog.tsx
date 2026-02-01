"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui";
import { Copy, Info } from "lucide-react";
import { toast } from "sonner";

interface DnsInstructionsDialogProps {
  domain: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DnsInstructionsDialog({
  domain,
  open,
  onOpenChange,
}: DnsInstructionsDialogProps) {
  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Скопировано", {
      description: `${label} скопировано в буфер обмена`,
    });
  };

  const firstLabel = domain
    .split(".")
    .filter((segment) => segment.length > 0)[0];
  const subdomain = firstLabel ?? "";

  const cnameValue = "cname.qbs.ru";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Настройка DNS записей</DialogTitle>
          <DialogDescription>
            Для верификации домена {domain} настройте следующие DNS записи у
            вашего провайдера
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <div className="flex gap-3">
              <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Если TTL 86400 недоступен, выберите максимально доступное
                значение. Распространение DNS может занять до 12 часов.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-3 font-medium">CNAME запись (рекомендуется)</h4>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Type</th>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Value</th>
                      <th className="px-4 py-2 text-left font-medium">TTL</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-mono">CNAME</td>
                      <td className="px-4 py-3 font-mono">{subdomain}</td>
                      <td className="px-4 py-3 font-mono">{cnameValue}</td>
                      <td className="px-4 py-3 font-mono">86400</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(cnameValue, "Value")}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Копировать</span>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">Следующие шаги</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Добавьте одну из DNS записей выше у вашего провайдера</li>
              <li>Дождитесь распространения DNS (до 12 часов)</li>
              <li>Нажмите кнопку "Проверить верификацию" на карточке домена</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
