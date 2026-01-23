"use client";

import { Badge, Button, DeleteVacancyDialog } from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MapPin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

/**
 * Маппинг источников вакансий на читаемые названия платформ
 */
const SOURCE_LABELS: Record<string, string> = {
  hh: "hh.ru",
  avito: "Avito",
  superjob: "SuperJob",
  kwork: "Kwork",
  fl: "FL.ru",
  freelance: "Freelance.ru",
};

/**
 * Возвращает читаемое название платформы по источнику
 */
function getSourceLabel(source: string | null | undefined): string {
  if (!source) return "источнике";
  return SOURCE_LABELS[source] ?? source;
}

interface VacancyHeaderProps {
  vacancyId: string;
  workspaceId: string;
  title: string;
  region: string | null;
  url: string | null;
  isActive: boolean | null;
  orgSlug: string;
  workspaceSlug: string;
  source?: string | null;
}

export function VacancyHeader({
  vacancyId,
  workspaceId,
  title,
  region,
  url,
  isActive,
  orgSlug,
  workspaceSlug,
  source,
}: VacancyHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: deleteVacancy, isPending: isDeleting } = useMutation(
    trpc.vacancy.delete.mutationOptions({
      onSuccess: (data: { success: boolean; message: string }) => {
        toast.success(data.message);
        void queryClient.invalidateQueries({
          queryKey: trpc.vacancy.list.queryKey(),
        });
        setIsDeleteDialogOpen(false);
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);
      },
      onError: (error) => {
        toast.error(`Ошибка удаления: ${error.message}`);
      },
    }),
  );

  const handleDeleteConfirm = (option: "anonymize" | "delete") => {
    deleteVacancy({
      vacancyId,
      workspaceId,
      dataCleanupOption: option,
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {isActive ? (
                <Badge variant="default" className="h-6">
                  Активна
                </Badge>
              ) : (
                <Badge variant="secondary" className="h-6">
                  Неактивна
                </Badge>
              )}
            </div>
            {region && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{region}</span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleting}
            aria-label="Удалить вакансию"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Удалить
          </Button>
        </div>

        {url && (
          <div>
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Открыть на {getSourceLabel(source)}
              </a>
            </Button>
          </div>
        )}
      </div>

      <DeleteVacancyDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        vacancyTitle={title}
        isLoading={isDeleting}
      />
    </>
  );
}
