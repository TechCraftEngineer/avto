"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { PageHeader } from "~/components/layout";
import { env } from "~/env";

import { GigForm, GigPreview, ProgressCard } from "./components";
import { WizardChat } from "./components/wizard-chat";
import { useCreateGig } from "./use-create-gig";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default function CreateGigPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug } = React.use(params);
  const {
    draft,
    form,
    quickReplies,
    pendingAssistantMessage,
    handleAssistantMessageConsumed,
    isGenerating,
    isCreating,
    showForm,
    setShowForm,
    workspace,
    handleWizardComplete,
    handleChatMessage,
    handleCreate,
    onSubmit,
    syncForm,
  } = useCreateGig({ orgSlug, workspaceSlug });

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <PageHeader
        title="Создание задания"
        description="Создание нового разового задания"
        tooltipContent={`Создайте разовое задание с помощью пошагового мастера. Укажите тип задания, требования и бюджет — AI поможет сформулировать описание.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/candidates/gig)`}
      >
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] touch-action-manipulation"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад к заданиям
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WizardChat
          onComplete={handleWizardComplete}
          isGenerating={isGenerating}
          onChatMessage={handleChatMessage}
          quickReplies={quickReplies}
          pendingAssistantMessage={pendingAssistantMessage}
          onAssistantMessageConsumed={handleAssistantMessageConsumed}
        />

        <div className="space-y-6">
          <GigPreview
            draft={draft}
            showForm={showForm}
            isCreating={isCreating}
            onEdit={syncForm}
            onCreate={handleCreate}
          >
            <GigForm
              form={form}
              onSubmit={onSubmit}
              onCancel={() => setShowForm(false)}
              isCreating={isCreating}
              workspaceId={workspace?.id}
            />
          </GigPreview>

          <ProgressCard draft={draft} />
        </div>
      </div>
    </div>
  );
}
