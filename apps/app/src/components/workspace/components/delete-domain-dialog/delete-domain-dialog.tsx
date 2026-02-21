"use client";

import type { CustomDomain } from "@qbs-autonaim/db/schema";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useDomainOperations } from "../../hooks";

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
  const { deleteDomain, isDeleting } = useDomainOperations({ workspaceId });

  const handleDelete = () => {
    deleteDomain(
      { domainId: domain.id },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

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
            disabled={isDeleting}
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Удалить домен
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
