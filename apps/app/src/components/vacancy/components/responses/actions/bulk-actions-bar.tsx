import { Button } from "@qbs-autonaim/ui/button";
import { Loader2, Send, UserCheck } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  isSendingWelcome: boolean;
  isProcessing: boolean;
  onSendWelcome: () => void;
  onBulkScreen: () => void;
}

export function BulkActionsBar({
  selectedCount,
  isSendingWelcome,
  isProcessing,
  onSendWelcome,
  onBulkScreen,
}: BulkActionsBarProps) {
  return (
    <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Выбрано: {selectedCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkScreen}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4 mr-2" />
          )}
          Оценить выбранные
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSendWelcome}
          disabled={isSendingWelcome}
        >
          {isSendingWelcome ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Отправить приветствие
        </Button>
      </div>
    </div>
  );
}
