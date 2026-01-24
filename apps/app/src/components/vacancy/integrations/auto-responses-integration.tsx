"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
} from "@qbs-autonaim/ui";
import { IconBolt, IconMessage } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

interface AutoResponsesIntegrationProps {
  vacancyId: string;
  workspaceId: string;
}

const autoResponsesSchema = z.object({
  welcomeMessageTemplates: z.object({
    webChat: z.string().max(2000).optional().or(z.literal("")),
    telegram: z.string().max(2000).optional().or(z.literal("")),
  }),
});

type AutoResponsesValues = z.infer<typeof autoResponsesSchema>;

export function AutoResponsesIntegration({
  vacancyId,
  workspaceId,
}: AutoResponsesIntegrationProps) {
  const api = useTRPC();
  const queryClient = useQueryClient();

  // Получаем данные вакансии
  const { data: vacancyData, isLoading } = useQuery(
    api.freelancePlatforms.getVacancyById.queryOptions({
      id: vacancyId,
      workspaceId,
    }),
  );

  const form = useForm<AutoResponsesValues>({
    resolver: zodResolver(autoResponsesSchema),
    defaultValues: {
      welcomeMessageTemplates: {
        webChat: "",
        telegram: "",
      },
    },
  });

  // Синхронизируем данные формы с данными вакансии
  React.useEffect(() => {
    if (vacancyData?.vacancy?.welcomeMessageTemplates) {
      form.reset({
        welcomeMessageTemplates: vacancyData.vacancy.welcomeMessageTemplates as {
          webChat?: string;
          telegram?: string;
        },
      });
    }
  }, [vacancyData, form]);

  const updateResponsesMutation = useMutation(
    api.vacancy.update.mutationOptions({
      onSuccess: () => {
        toast.success("Автоматические ответы обновлены");
        queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancyById.queryKey({
            id: vacancyId,
            workspaceId,
          }),
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось обновить автоматические ответы";
        toast.error(message);
      },
    }),
  );

  const onSubmit = (values: AutoResponsesValues) => {
    updateResponsesMutation.mutate({
      vacancyId,
      workspaceId,
      settings: {
        welcomeMessageTemplates: values.welcomeMessageTemplates,
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconBolt className="size-5 text-muted-foreground" />
            Автоматические ответы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconBolt className="size-5 text-muted-foreground" />
          Автоматические ответы
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Настройте приветственные сообщения, которые будут автоматически отправляться кандидатам при первом контакте
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              {/* Веб-чат */}
              <FormField
                control={form.control}
                name="welcomeMessageTemplates.webChat"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <IconMessage className="size-4" />
                      Приветственное сообщение для веб-чата
                    </FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">
                      Это сообщение будет автоматически отправлено кандидату при начале общения в веб-чате.
                      Оставьте пустым, чтобы использовать сообщение по умолчанию.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Здравствуйте! Спасибо за интерес к вакансии. Расскажите, пожалуйста, о вашем опыте работы..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Telegram */}
              <FormField
                control={form.control}
                name="welcomeMessageTemplates.telegram"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <IconMessage className="size-4" />
                      Приветственное сообщение для Telegram
                    </FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">
                      Это сообщение будет автоматически отправлено кандидату при начале общения в Telegram.
                      Оставьте пустым, чтобы использовать сообщение по умолчанию.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Здравствуйте! Спасибо за интерес к вакансии. Расскажите, пожалуйста, о вашем опыте работы..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateResponsesMutation.isPending}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                {updateResponsesMutation.isPending && (
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                )}
                Сохранить шаблоны
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}