import { Button } from "@qbs-autonaim/ui/components/button";
import {
  AlertCircle,
  Archive,
  Download,
  Sparkles,
  XCircle,
} from "lucide-react";
import { getModeConfig } from "./mode-config";
import type { SyncMode } from "./types";

const MODE_ICONS = {
  archive: Archive,
  sparkles: Sparkles,
  download: Download,
} as const;

interface ConfirmationViewProps {
  mode: SyncMode;
  onClose: () => void;
  onConfirm: () => void;
  totalResponses?: number;
}

export function ConfirmationView({
  mode,
  onClose,
  onConfirm,
  totalResponses,
}: ConfirmationViewProps) {
  const config = getModeConfig(mode, totalResponses);
  const Icon = MODE_ICONS[config.iconType];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">{config.title}</h4>
          <p className="text-xs text-muted-foreground mb-3">
            {config.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-md transition-colors shrink-0 touch-manipulation min-w-[24px] min-h-[24px] flex items-center justify-center"
          aria-label="Закрыть"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs">
            <p className="font-medium text-foreground">
              Что будет происходить:
            </p>
            <ul className="space-y-0.5 text-muted-foreground list-disc list-inside">
              {config.listItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>
          Отмена
        </Button>
        <Button size="sm" onClick={onConfirm}>
          <Icon className="h-4 w-4 mr-2" />
          {config.confirmLabel}
        </Button>
      </div>
    </div>
  );
}
