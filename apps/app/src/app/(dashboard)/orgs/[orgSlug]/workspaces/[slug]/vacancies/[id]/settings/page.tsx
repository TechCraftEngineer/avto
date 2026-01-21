"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { VacancySettingsForm } from "~/components/vacancy/vacancy-settings-form";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancySettingsPageProps {
  params: Promise<{ workspaceSlug: string; id: string }>;
}

export default function VacancySettingsPage({
  params,
}: VacancySettingsPageProps) {
  const { id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();

  const { data: vacancy } = useQuery({
    ...trpc.vacancy.get.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const updateSettingsMutation = useMutation(
    trpc.vacancy.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: [
            ["vacancy", "getById"],
            { input: { id, workspaceId: workspaceId ?? "" } },
          ],
        });
      },
    }),
  );

  const improveInstructionsMutation = useMutation(
    trpc.vacancy.improveInstructions.mutationOptions(),
  );

  const handleSave = async (data: {
    customBotInstructions?: string | null;
    customScreeningPrompt?: string | null;
    customInterviewQuestions?: string | null;
    customOrganizationalQuestions?: string | null;
  }) => {
    if (!workspaceId) return;

    await updateSettingsMutation.mutateAsync({
      vacancyId: id,
      workspaceId,
      settings: data,
    });
  };

  const handleImprove = async (
    fieldType:
      | "customBotInstructions"
      | "customScreeningPrompt"
      | "customInterviewQuestions"
      | "customOrganizationalQuestions",
    currentValue: string,
    context?: { vacancyTitle?: string; vacancyDescription?: string },
  ): Promise<string> => {
    if (!workspaceId) throw new Error("Workspace ID not found");

    const result = await improveInstructionsMutation.mutateAsync({
      vacancyId: id,
      workspaceId,
      fieldType,
      currentValue,
      vacancyTitle: context?.vacancyTitle ?? vacancy?.title,
      vacancyDescription:
        context?.vacancyDescription ?? vacancy?.description ?? undefined,
    });

    return result.improvedText;
  };

  if (!vacancy) {
    return null;
  }

  return (
    <div className="space-y-6">
      <VacancySettingsForm
        vacancyTitle={vacancy.title}
        vacancyDescription={vacancy.description ?? undefined}
        initialData={{
          customBotInstructions: vacancy.customBotInstructions,
          customScreeningPrompt: vacancy.customScreeningPrompt,
          customInterviewQuestions: vacancy.customInterviewQuestions,
          customOrganizationalQuestions: vacancy.customOrganizationalQuestions,
        }}
        onSave={handleSave}
        onImprove={handleImprove}
      />
    </div>
  );
}
