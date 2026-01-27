"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use, useEffect, useState } from "react";
import { VacancySettingsForm } from "~/components/vacancy";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancySettingsPageProps {
  params: Promise<{ workspaceSlug: string; id: string }>;
}

type InterviewLink = {
  id: string;
  vacancyId: string;
  token: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
};

export default function VacancySettingsPage({
  params,
}: VacancySettingsPageProps) {
  const { id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();
  const [interviewLink, setInterviewLink] = useState<InterviewLink | null>(null);

  const { data: vacancy } = useQuery({
    ...trpc.vacancy.get.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  // Получаем ссылку на интервью для вакансии
  const getInterviewLinkMutation = useMutation(
    trpc.vacancy.getInterviewLink.mutationOptions({
      onSuccess: (data) => {
        setInterviewLink(data);
      },
    })
  );

  // Получаем ссылку на интервью при загрузке вакансии
  useEffect(() => {
    if (vacancy && workspaceId && !interviewLink && getInterviewLinkMutation.isIdle) {
      getInterviewLinkMutation.mutate({
        vacancyId: id,
        workspaceId,
      });
    }
  }, [vacancy, workspaceId, id, interviewLink, getInterviewLinkMutation.isIdle, getInterviewLinkMutation.mutate]);

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
    enabledCommunicationChannels?: {
      webChat: boolean;
      telegram: boolean;
    };
    welcomeMessageTemplates?: {
      webChat?: string;
      telegram?: string;
    };
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
      | "customOrganizationalQuestions"
      | "welcomeMessageTemplates",
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
        vacancyId={id}
        workspaceId={workspaceId}
        interviewUrl={interviewLink?.url}
        initialData={{
          customBotInstructions: vacancy.customBotInstructions,
          customScreeningPrompt: vacancy.customScreeningPrompt,
          customInterviewQuestions: vacancy.customInterviewQuestions,
          customOrganizationalQuestions: vacancy.customOrganizationalQuestions,
          enabledCommunicationChannels:
            vacancy.enabledCommunicationChannels ?? undefined,
          welcomeMessageTemplates: vacancy.welcomeMessageTemplates ?? undefined,
        }}
        onSave={handleSave}
        onImprove={handleImprove}
      />
    </div>
  );
}
