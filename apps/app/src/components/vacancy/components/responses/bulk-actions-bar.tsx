import Button from "@qbs-autonaim/ui/button";
import { Loader2, Send, Sparkles } from "lucide-react";

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
    <div className="flex items-center justify-between gap-4 border-b border-primary/20 bg-primary/10 backdrop-blur-sm px-6 py-3 transition-all animate-in slide-in-from-top-1">
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
          {selectedCount}
        </div>
        <p className="text-sm font-bold text-primary uppercase tracking-wider">
          Кандидата выбрано
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onSendWelcome}
          disabled={isSendingWelcome}
          size="sm"
          variant="outline"
          className="h-9 px-4 rounded-full border-primary/30 bg-background/80 hover:bg-background transition-all font-semibold"
        >
          {isSendingWelcome ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Приветствие
        </Button>
        <Button
          onClick={onBulkScreen}
          disabled={isProcessing}
          size="sm"
          className="h-9 px-4 rounded-full shadow-lg shadow-primary/20 font-bold"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Запустить оценку
        </Button>
      </div>
    </div>
  );
}

