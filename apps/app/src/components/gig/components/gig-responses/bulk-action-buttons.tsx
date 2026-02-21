"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { CheckCircle, Download, XCircle } from "lucide-react";

interface BulkActionButtonsProps {
  selectedCount: number;
  onAccept: () => void;
  onReject: () => void;
  onExport: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  isExporting?: boolean;
}

export function BulkActionButtons({
  selectedCount,
  onAccept,
  onReject,
  onExport,
  isAccepting,
  isRejecting,
  isExporting,
}: BulkActionButtonsProps) {
  if (selectedCount === 0) {
    return (
      <Button variant="outline" onClick={onExport} disabled={isExporting}>
        <Download className="h-4 w-4 mr-2" />
        Экспорт
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">
        Выбрано: {selectedCount}
      </span>
      <Button
        variant="default"
        size="sm"
        onClick={onAccept}
        disabled={isAccepting}
        className="gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        Принять
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReject}
        disabled={isRejecting}
        className="gap-2"
      >
        <XCircle className="h-4 w-4" />
        Отклонить
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={isExporting}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Экспорт
      </Button>
    </div>
  );
}
