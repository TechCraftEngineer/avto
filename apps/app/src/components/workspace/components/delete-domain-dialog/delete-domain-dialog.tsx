"use client";

import type { CustomDomain } from "@qbs-autonaim/db/schema";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface DeleteDomainDialogProps {
  domain: CustomDomain;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDomainDialog({
  domain,
  workspaceId,
  open,
  onOpenChange,
}: DeleteDomainDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.customDomain.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Домен удалён", {
          description: `Домен ${domain.domain} успешно удалён`,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.customDomain.list.queryKey({
            workspaceId,
          }),
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Ошибка", {
          description: error.message,
        });
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Удалить домен?
          </DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите удалить домен{" "}
            <span className="font-mono font-medium">{domain.domain}</span>?
            {domain.isPrimary && (
              <span className="mt-2 block text-destructive">
                Это основной домен workspace. После удаления будет
                использоваться домен по умолчанию.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate({ domainId: domain.id })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Удалить домен
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
