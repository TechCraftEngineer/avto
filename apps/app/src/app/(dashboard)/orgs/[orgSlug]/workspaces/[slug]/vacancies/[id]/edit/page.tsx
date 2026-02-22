"use client";

import type { UpdateFullVacancyInput } from "@qbs-autonaim/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { VacancyFullEditForm } from "~/components/vacancy/components";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";

interface VacancyEditPageProps {
  params: Promise<{ orgSlug: string; slug: string; id: string }>;
}

export default function VacancyEditPage({ params }: VacancyEditPageProps) {
  const { id } = use(params);
  const orpc = useORPC();
  const { workspaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();

  const { data: vacancy } = useQuery({
    ...orpc.vacancy.get.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const updateFullMutation = useMutation(
    orpc.vacancy.updateFull.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.vacancy.get.queryKey({
            id,
            workspaceId: workspaceId ?? "",
          }),
        });
        void queryClient.invalidateQueries({
          queryKey: orpc.vacancy.list.queryKey(),
        });
      },
    }),
  );

  const handleSave = async (data: UpdateFullVacancyInput) => {
    if (!workspaceId) return;

    await updateFullMutation.mutateAsync({
      vacancyId: id,
      workspaceId,
      data,
    });
  };

  if (!vacancy) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <VacancyFullEditForm vacancy={vacancy} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
