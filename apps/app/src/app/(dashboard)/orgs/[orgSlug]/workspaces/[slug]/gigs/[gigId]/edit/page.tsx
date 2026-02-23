"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "~/components/layout";
import { env } from "~/env";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

const gigTypeOptions = [
  { value: "DEVELOPMENT", label: "Разработка" },
  { value: "DESIGN", label: "Дизайн" },
  { value: "COPYWRITING", label: "Копирайтинг" },
  { value: "MARKETING", label: "Маркетинг" },
  { value: "TRANSLATION", label: "Перевод" },
  { value: "VIDEO", label: "Видео" },
  { value: "AUDIO", label: "Аудио" },
  { value: "DATA_ENTRY", label: "Ввод данных" },
  { value: "RESEARCH", label: "Исследования" },
  { value: "CONSULTING", label: "Консультации" },
  { value: "OTHER", label: "Другое" },
];

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Название обязательно")
    .max(500, "Название не должно превышать 500 символов"),
  description: z
    .string()
    .max(10000, "Описание не должно превышать 10000 символов")
    .optional(),
  customBotInstructions: z.string().optional(),
  customScreeningPrompt: z.string().optional(),
  customInterviewQuestions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function EditGigSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EditGigPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = React.use(params);
  const router = useRouter();
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const {
    data: gig,
    isLoading,
    isError,
  } = useQuery({
    ...orpc.gig.get.queryOptions({
      input: {
        id: gigId,
        workspaceId: workspace?.id ?? "",
      },
    }),
    enabled: !!workspace?.id,
  });

  // Загружаем настройки бота для отображения
  const { data: botSettings } = useQuery({
    ...orpc.workspace.getBotSettings.queryOptions({
      input: {
        workspaceId: workspace?.id ?? "",
      },
    }),
    enabled: !!workspace?.id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      customBotInstructions: "",
      customScreeningPrompt: "",
      customInterviewQuestions: "",
    },
  });

  const { mutate: updateGig, isPending } = useMutation(
    orpc.gig.update.mutationOptions({
      onSuccess: () => {
        toast.success("Задание обновлено");
        queryClient.invalidateQueries({
          queryKey: orpc.gig.get.queryKey({
            input: {
              id: gigId,
              workspaceId: workspace?.id ?? "",
            },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.gig.list.queryKey({
            input: {
              workspaceId: workspace?.id ?? "",
            },
          }),
        });
        router.push(
          `/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`,
        );
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось обновить задание");
      },
    }),
  );

  // Отслеживание несохраненных изменений
  const isDirty = form.formState.isDirty;

  // Предупреждение о несохраненных изменениях при уходе со страницы
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isPending) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isPending]);

  // Заполняем форму данными gig при загрузке
  React.useEffect(() => {
    if (gig) {
      form.reset({
        title: gig.title,
        description: gig.description || "",
        customBotInstructions: gig.customBotInstructions || "",
        customScreeningPrompt: gig.customScreeningPrompt || "",
        customInterviewQuestions: gig.customInterviewQuestions || "",
      });
    }
  }, [gig, form]);

  const onSubmit = (values: FormValues) => {
    if (!workspace?.id) return;

    updateGig({
      gigId: gigId,
      workspaceId: workspace.id,
      settings: {
        title: values.title.trim(),
        description: values.description?.trim() || null,
        customDomainId: null,
        interviewScenarioId: null,
        customBotInstructions: values.customBotInstructions?.trim() || null,
        customScreeningPrompt: values.customScreeningPrompt?.trim() || null,
        customInterviewQuestions:
          values.customInterviewQuestions?.trim() || null,
      },
    });
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?",
      );
      if (!confirmed) return;
    }
    router.back();
  };

  if (isLoading || !workspace?.id) {
    return <EditGigSkeleton />;
  }

  if (isError || !gig) {
    return (
      <div className="container mx-auto max-w-2xl py-12 px-4 sm:py-16 sm:px-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Задание не найдено</CardTitle>
            <CardDescription>
              Задание, которое вы пытаетесь редактировать, не существует или
              было удалено
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button asChild className="min-h-[44px] touch-action-manipulation">
              <Link href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}>
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Вернуться к заданиям
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <PageHeader
        title="Редактирование задания"
        description="Редактирование существующего задания"
        tooltipContent={`На этой странице можно изменить название, описание и параметры задания. После сохранения изменения применятся ко всем связанным процессам.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/candidates/gig)`}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information - Editable */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Название и описание задания</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Название задания
                      <span
                        className="text-destructive ml-1"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Например: Разработка лендинга для стартапа"
                        className="min-h-[44px] touch-action-manipulation"
                        autoComplete="off"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Краткое и понятное название задания (до 500 символов)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание задания</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Подробное описание задания, требований и ожиданий…"
                        className="min-h-32 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Детальное описание задания, что нужно сделать и какие
                      требования к исполнителю
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Тип
                  </div>
                  <p className="text-sm">
                    {gigTypeOptions.find((opt) => opt.value === gig.type)
                      ?.label || gig.type}
                  </p>
                </div>
                {gig.budgetMin && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Мин. бюджет
                    </div>
                    <p className="text-sm font-variant-numeric-tabular">
                      {gig.budgetMin}&nbsp;₽
                    </p>
                  </div>
                )}
                {gig.budgetMax && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Макс. бюджет
                    </div>
                    <p className="text-sm font-variant-numeric-tabular">
                      {gig.budgetMax}&nbsp;₽
                    </p>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Статус
                  </div>
                  <p className="text-sm">
                    {gig.isActive ? "Активное" : "Неактивное"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings - Editable */}
          <Card>
            <CardHeader>
              <CardTitle>Настройки ИИ</CardTitle>
              <CardDescription>
                Кастомные инструкции для автоматизации
                {botSettings && (
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                    <div className="font-medium mb-1">Настройки бота:</div>
                    <div className="space-y-1 text-muted-foreground">
                      {(botSettings.botName || botSettings.botRole) && (
                        <div>
                          Бот: {botSettings.botName || "Не указано"}
                          {botSettings.botRole && ` (${botSettings.botRole})`}
                        </div>
                      )}
                      <div>Компания: {botSettings.companyName}</div>
                      {botSettings.companyDescription && (
                        <div>Описание: {botSettings.companyDescription}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customBotInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Инструкции для бота</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Специальные инструкции для бота при работе с откликами..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Эти инструкции будут использоваться ботом при обработке
                      откликов.
                      {botSettings &&
                        (botSettings.botName || botSettings.botRole) && (
                          <span className="block mt-1 text-xs">
                            Бот будет представляться как{" "}
                            {botSettings.botName || "бот"}
                            {botSettings.botRole && ` - ${botSettings.botRole}`}{" "}
                            компании "{botSettings.companyName}".
                          </span>
                        )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customScreeningPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Промпт для скрининга</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Кастомный промпт для автоматического скрининга кандидатов..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Используется для автоматической оценки откликов.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customInterviewQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вопросы для интервью</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Список вопросов для интервью с кандидатами..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Вопросы, которые будут использоваться при интервью
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={isPending}
              className="min-h-[44px] touch-action-manipulation"
            >
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              {isPending ? "Сохранение…" : "Сохранить изменения"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="min-h-[44px] touch-action-manipulation"
            >
              Отмена
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
