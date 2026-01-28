"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@qbs-autonaim/ui";
import {
  IconCheck,
  IconCopy,
  IconLoader2,
  IconMessagePlus,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface ResponseInvitationButtonProps {
  responseId: string;
  candidateName?: string | null;
}

export function ResponseInvitationButton({
  responseId,
  candidateName,
}: ResponseInvitationButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const { mutate: generateInvitation, isPending: isGenerating } = useMutation(
    trpc.gig.responses.generateInvitation.mutationOptions({
      onSuccess: (data) => {
        setInvitationData(data);
        toast.success("Приглашение сгенерировано");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const [invitationData, setInvitationData] = useState<{
    invitationText: string;
    interviewUrl: string;
    createdAt: Date;
  } | null>(null);

  const handleGenerate = useCallback(() => {
    if (!workspace?.id) return;
    generateInvitation({ responseId, workspaceId: workspace.id });
  }, [generateInvitation, responseId, workspace?.id]);

  // Автоматически генерируем приглашение при открытии диалога
  React.useEffect(() => {
    if (open && !invitationData && !isGenerating && workspace?.id) {
      generateInvitation({ responseId, workspaceId: workspace.id });
    }
  }, [
    open,
    invitationData,
    isGenerating,
    workspace?.id,
    generateInvitation,
    responseId,
  ]);

  const handleCopy = useCallback(async () => {
    if (!invitationData?.invitationText) return;
    try {
      await navigator.clipboard.writeText(invitationData.invitationText);
      setCopied(true);
      toast.success("Приглашение скопировано");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [invitationData?.invitationText]);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="min-h-[32px]"
        aria-label={`Сгенерировать приглашение для ${candidateName || "кандидата"}`}
      >
        <IconMessagePlus className="size-4 mr-2" aria-hidden="true" />
        Приглашение
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Приглашение на интервью</DialogTitle>
            <DialogDescription>
              {candidateName
                ? `Приглашение для ${candidateName}`
                : "Сгенерируйте текст приглашения для отправки кандидату"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <IconLoader2
                  className="size-6 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="sr-only">Генерация приглашения…</span>
              </div>
            ) : invitationData ? (
              <>
                <Textarea
                  value={invitationData.invitationText}
                  readOnly
                  rows={10}
                  className="resize-none font-mono text-sm"
                  aria-label="Текст приглашения"
                />

                <div className="text-xs text-muted-foreground">
                  Ссылка на интервью: {invitationData.interviewUrl}
                </div>

                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full min-h-[44px]"
                  aria-label="Скопировать приглашение"
                >
                  {copied ? (
                    <>
                      <IconCheck className="size-4 mr-2" aria-hidden="true" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <IconCopy className="size-4 mr-2" aria-hidden="true" />
                      Копировать приглашение
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Приглашение генерируется автоматически. Пожалуйста, подождите…
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
