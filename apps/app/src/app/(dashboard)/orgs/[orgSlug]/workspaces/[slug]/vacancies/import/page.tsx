"use client";

import { Button, Card, Input, Label } from "@qbs-autonaim/ui";
import { IconArrowLeft, IconDownload, IconLoader2 } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

export default function ImportVacancyPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const { workspace } = useWorkspace();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const importMutation = useMutation(
    trpc.freelancePlatforms.importVacancyByUrl.mutationOptions({
      onSuccess: async () => {
        toast.success("Импорт вакансии запущен", {
          description: "Вакансия будет добавлена в течение нескольких минут",
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.freelancePlatforms.getVacancies.queryKey(),
        });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);
      },
      onError: (error) => {
        toast.error("Ошибка импорта", {
          description: error.message || "Не удалось импортировать вакансию",
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Введите ссылку на вакансию");
      return;
    }

    if (!url.includes("hh.ru/vacancy/")) {
      toast.error("Поддерживаются только вакансии с hh.ru");
      return;
    }

    if (!workspace?.id) {
      toast.error("Рабочее пространство не найдено");
      return;
    }

    importMutation.mutate({
      workspaceId: workspace.id,
      url: url.trim(),
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Импорт вакансии"
        description="Импортируйте вакансию с hh.ru для автоматического отслеживания откликов"
      >
        <Button asChild variant="outline" className="h-9 gap-2">
          <Link href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}>
            <IconArrowLeft className="size-4" />
            <span>Назад</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="@container/main mx-auto flex w-full max-w-[800px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vacancy-url">Ссылка на вакансию</Label>
              <Input
                id="vacancy-url"
                type="url"
                placeholder="https://hh.ru/vacancy/123456789"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={importMutation.isPending}
                autoFocus
                className="h-11"
              />
              <p className="text-sm text-muted-foreground">
                Вставьте ссылку на вакансию с hh.ru
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="mb-3 font-semibold text-foreground">
                Что будет импортировано:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>Название и описание вакансии</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>Требования к кандидатам и обязанности</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>Условия работы и информация о зарплате</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>Автоматическое отслеживание новых откликов</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`,
                  )
                }
                disabled={importMutation.isPending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={importMutation.isPending}>
                {importMutation.isPending ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Импорт...
                  </>
                ) : (
                  <>
                    <IconDownload className="mr-2 size-4" />
                    Импортировать
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
            Как это работает?
          </h3>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <span>
                Скопируйте ссылку на вашу вакансию из личного кабинета hh.ru
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span>Вставьте ссылку в поле выше и нажмите "Импортировать"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span>
                Система автоматически загрузит данные вакансии и начнёт
                отслеживать отклики
              </span>
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
