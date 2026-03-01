"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import {
  GigConversationChat,
  GigForm,
  GigPreview,
  ProgressCard,
  useCreateGig,
} from "~/components/gig";
import { PageHeader } from "~/components/layout";
import { env } from "~/env";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default function CreateGigPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug } = React.use(params);
  const {
    draft,
    form,
    chatMessages,
    isGenerating,
    isCreating,
    showForm,
    setShowForm,
    workspace,
    handleSendMessage,
    handleReset,
    handleCreate,
    onSubmit,
    syncForm,
    streamingMessage,
    streamingQuickReplies,
  } = useCreateGig({ orgSlug, workspaceSlug });

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <PageHeader
        title="Создание задания"
        description="Создание нового разового задания"
        tooltipContent={`Опишите задание своими словами — AI проведёт вас по шагам (тип задачи, бюджет, сроки) и сформирует ТЗ.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/candidates/gig)`}
      >
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] touch-action-manipulation"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад к заданиям
        </Link>
      </PageHeader>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GigConversationChat
          messages={chatMessages}
          isGenerating={isGenerating}
          streamingMessage={streamingMessage}
          streamingQuickReplies={streamingQuickReplies}
          onSendMessage={handleSendMessage}
          onReset={handleReset}
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
