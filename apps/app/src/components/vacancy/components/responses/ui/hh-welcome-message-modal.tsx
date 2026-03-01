"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { ClipboardCopy, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

interface HhWelcomeMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseId: string;
  workspaceId: string;
}

export function HhWelcomeMessageModal({
  open,
  onOpenChange,
  responseId,
  workspaceId,
}: HhWelcomeMessageModalProps) {
  const [message, setMessage] = useState("");
  const orpc = useORPC();
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const { mutate: generateMessage, isPending: isGenerating } = useMutation(
    orpc.vacancy.responses.generateWelcomeMessage.mutationOptions({
      onSuccess: (data) => {
        if (openRef.current) {
          setMessage(data.message);
        }
        toast.success("Приветствие сгенерировано");
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось сгенерировать приветствие");
      },
    }),
  );

  const handleGenerate = () => {
    generateMessage({ responseId, workspaceId });
  };

  const handleCopy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Сообщение скопировано в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setMessage("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Приветствие для HH.ru
          </DialogTitle>
          <DialogDescription>
            Сгенерируйте приветственное сообщение и скопируйте его. Отправьте
            сообщение самостоятельно в чате с кандидатом на hh.ru.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!message && !isGenerating && (
            <Button onClick={handleGenerate} className="w-full gap-2" size="lg">
              <Sparkles className="h-4 w-4" />
              Сгенерировать приветствие
            </Button>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Генерация приветствия…</span>
            </div>
          )}

          {message && (
            <>
              <Textarea
                id="hh-welcome-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Приветственное сообщение"
                rows={10}
                className="font-sans text-base resize-none"
                aria-label="Приветственное сообщение"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  variant="default"
                  className="gap-2 flex-1"
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Скопировать
                </Button>
                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Сгенерировать заново
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
