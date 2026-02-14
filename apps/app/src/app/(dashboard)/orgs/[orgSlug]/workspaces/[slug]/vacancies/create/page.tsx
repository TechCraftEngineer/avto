"use client";

import { Button } from "@qbs-autonaim/ui";
import { IconArrowLeft, IconEdit, IconSparkles } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";

const VacancyForm = dynamic(
  () =>
    import("~/components/vacancies/components/vacancy-form/vacancy-form").then(
      (mod) => mod.VacancyForm,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg bg-card p-6 shadow-sm animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-10 bg-muted rounded w-1/3" />
        </div>
      </div>
    ),
  },
);

const AIVacancyChat = dynamic(
  () =>
    import("~/components/chat/components/vacancy-chat/ai-vacancy-chat").then(
      (mod) => mod.AIVacancyChat,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b bg-background px-4 py-3 md:px-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-64 mb-2" />
            <div className="h-4 bg-muted rounded w-96" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-4" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
        </div>
      </div>
    ),
  },
);

import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";

type CreationMode = "select" | "ai" | "manual";

export default function CreateVacancyPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const { workspace } = useWorkspace();
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>("select");

  const handleManualSuccess = () => {
    toast.success("Вакансия успешно создана");
    router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);
  };

  if (!workspace) {
    return null;
  }

  // Режим выбора
  if (mode === "select") {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Создание вакансии"
          description="Выберите способ создания вакансии"
        >
          <Button variant="outline" asChild>
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
              aria-label="Вернуться к списку вакансий"
            >
              <IconArrowLeft className="size-4" aria-hidden="true" />
              Назад к списку
            </Link>
          </Button>
        </PageHeader>

        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
            {/* AI-помощник */}
            <button
              type="button"
              onClick={() => setMode("ai")}
              className="group relative flex flex-col items-start gap-4 rounded-lg border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <IconSparkles className="size-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">AI-помощник</h3>
                <p className="text-sm text-muted-foreground">
                  Создайте вакансию в диалоге с AI-ассистентом. Он задаст
                  вопросы и поможет сформулировать требования.
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Быстро
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Интерактивно
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Рекомендуется
                </span>
              </div>
            </button>

            {/* Ручное создание */}
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="group relative flex flex-col items-start gap-4 rounded-lg border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <IconEdit className="size-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Ручное создание</h3>
                <p className="text-sm text-muted-foreground">
                  Заполните форму самостоятельно. Подходит для опытных
                  пользователей с готовым описанием вакансии.
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Полный контроль
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Классическая форма
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Режим AI-помощника
  if (mode === "ai") {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b bg-background px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">
                Создание вакансии с AI
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-ассистент поможет создать вакансию
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("select")}
              >
                Сменить режим
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
                  aria-label="Вернуться к списку вакансий"
                >
                  <IconArrowLeft className="size-4" aria-hidden="true" />
                  Назад
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <AIVacancyChat
            workspaceId={workspace.id}
            orgSlug={orgSlug ?? ""}
            workspaceSlug={workspaceSlug ?? ""}
          />
        </div>
      </div>
    );
  }

  // Режим ручного создания
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Создание вакансии"
        description="Заполните форму для создания вакансии"
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMode("select")}>
            Сменить режим
          </Button>
          <Button variant="outline" asChild>
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
              aria-label="Вернуться к списку вакансий"
            >
              <IconArrowLeft className="size-4" aria-hidden="true" />
              Назад к списку
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-lg bg-card p-6 shadow-sm">
            <VacancyForm onSuccess={handleManualSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}
