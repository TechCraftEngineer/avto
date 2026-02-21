"use client";

import { Button } from "@qbs-autonaim/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@qbs-autonaim/ui/components/dialog"
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { Loader2 } from "lucide-react";

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName?: string | null;
  messageText: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  isProcessing: boolean;
}

export function MessageDialog({
  open,
  onOpenChange,
  candidateName,
  messageText,
  onMessageChange,
  onSend,
  isProcessing,
}: MessageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Отправить сообщение
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Напишите сообщение кандидату{" "}
            {candidateName && (
              <span className="font-medium break-words">{candidateName}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Введите ваше сообщение…"
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={6}
            className="resize-none text-base sm:text-sm"
            style={{ fontSize: "16px" }}
          />
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto min-h-11 sm:min-h-9 touch-manipulation"
          >
            Отмена
          </Button>
          <Button
            onClick={onSend}
            disabled={isProcessing || !messageText.trim()}
            className="w-full sm:w-auto min-h-11 sm:min-h-9 touch-manipulation"
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
