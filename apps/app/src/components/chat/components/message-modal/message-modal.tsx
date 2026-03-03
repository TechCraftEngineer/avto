"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import { Label } from "@qbs-autonaim/ui/components/label";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { Loader2, Send } from "lucide-react";
import React from "react";

interface MessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName?: string;
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function MessageModal({
  open,
  onOpenChange,
  candidateName,
  onSend,
  isLoading = false,
}: MessageModalProps) {
  const [message, setMessage] = React.useState("");

  const submitMessage = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitMessage();
    }
  };

  React.useEffect(() => {
    if (!open) {
      setMessage("");
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Only allow closing when not loading, or when opening the dialog
        if (!isLoading || newOpen) {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl pr-8">
              Написать сообщение
            </DialogTitle>
            <DialogDescription className="text-sm">
              {candidateName
                ? `Отправить сообщение кандидату ${candidateName}`
                : "Отправить сообщение кандидату"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Сообщение</Label>
              <Textarea
                id="message"
                placeholder="Введите ваше сообщение…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
                maxLength={4000}
                disabled={isLoading}
                autoFocus
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/4000
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto min-h-11 touch-manipulation"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="w-full sm:w-auto min-w-0 sm:min-w-[100px] min-h-11 touch-manipulation"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправка…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
