"use client";

import { Button } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { AddDomainDialog } from "./add-domain-dialog";
import { DomainCard } from "./domain-card";

interface CustomDomainsSectionProps {
  workspaceId: string;
}

export function CustomDomainsSection({
  workspaceId,
}: CustomDomainsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const trpc = useTRPC();

  const {
    data: domains,
    isLoading,
    error,
    refetch,
  } = useQuery(
    trpc.customDomain.list.queryOptions({
      workspaceId,
    }),
  );

  if (isLoading) {
    return (
      <output className="space-y-4" aria-live="polite">
        <span className="sr-only">Загрузка кастомных доменов</span>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </output>
    );
  }

  if (error) {
    // Логируем полную информацию об ошибке для разработчиков
    console.error("Ошибка загрузки доменов:", {
      component: "CustomDomainsSection",
      workspaceId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-destructive">
              Не удалось загрузить домены
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Не удалось загрузить домены. Попробуйте снова.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Кастомные домены</h3>
          <p className="text-sm text-muted-foreground">
            Используйте собственный домен для ссылок на интервью
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить домен
        </Button>
      </div>

      {domains && domains.length > 0 ? (
        <div className="space-y-3">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            У вас пока нет кастомных доменов
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить первый домен
          </Button>
        </div>
      )}

      <AddDomainDialog
        workspaceId={workspaceId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
