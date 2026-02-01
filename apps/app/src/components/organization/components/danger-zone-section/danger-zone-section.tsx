"use client";

import { Button } from "@qbs-autonaim/ui";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteOrganizationDialog } from "~/components/organization";
import { useTRPC } from "~/trpc/react";

interface DangerZoneSectionProps {
  organizationId: string;
  organizationName: string;
}

export function DangerZoneSection({
  organizationId,
  organizationName,
}: DangerZoneSectionProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteOrganization = useMutation(
    trpc.organization.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Организация успешно удалена");
        router.push("/");
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Не удалось удалить организацию";
        toast.error(message);
      },
    }),
  );

  const handleDeleteOrganization = () => {
    deleteOrganization.mutate({ id: organizationId });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Удалить организацию
              </h3>
              <p className="text-sm text-muted-foreground">
                Внимание: Это безвозвратно удалит вашу организацию и все
                связанные данные.
              </p>
            </div>

            <div className="rounded-md border border-destructive/30 bg-background p-4">
              <p className="text-sm font-medium mb-2">
                Будут удалены следующие данные:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Все рабочие пространства организации</li>
                <li>Все интеграции и настройки</li>
                <li>Все вакансии и отклики кандидатов</li>
                <li>Все данные и файлы</li>
              </ul>
            </div>

            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteOrganization.isPending}
            >
              Удалить организацию
            </Button>
          </div>
        </div>
      </div>

      <DeleteOrganizationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        organizationName={organizationName}
        onConfirm={handleDeleteOrganization}
        isDeleting={deleteOrganization.isPending}
      />
    </div>
  );
}
